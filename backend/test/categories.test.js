const { test } = require('node:test');
const assert = require('node:assert/strict');

let categories;
let books;
let failDelete;
let locks;
const transaction = { LOCK: { UPDATE: 'UPDATE' } };
const Category = {
  findAll: async () => categories.map(category => ({ toJSON: () => category, catID: category.catID })),
  create: async values => {
    if (categories.some(category => category.slug === values.slug || category.name === values.name)) {
      throw Object.assign(new Error('Duplicate'), { name: 'SequelizeUniqueConstraintError' });
    }
    const category = { catID: 3, ...values };
    categories.push(category);
    return { toJSON: () => category };
  },
  findByPk: async (id, options) => {
    assert.equal(options.transaction, transaction);
    assert.equal(options.lock, 'UPDATE');
    locks.push(id);
    const category = categories.find(category => category.catID === id);
    return category && { ...category, destroy: async options => {
      assert.equal(options.transaction, transaction);
      if (failDelete) throw new Error('Delete failed');
      assert.ok(!books.some(book => book.categoryID === id));
      categories = categories.filter(category => category.catID !== id);
    } };
  }
};
const Book = {
  count: async options => {
    if (options.group) return categories.map(category => ({ categoryID: category.catID, count: books.filter(book => book.categoryID === category.catID).length }));
    assert.equal(options.transaction, transaction);
    return books.filter(book => book.categoryID === options.where.categoryID).length;
  },
  update: async (values, options) => {
    assert.equal(options.transaction, transaction);
    books.forEach(book => { if (book.categoryID === options.where.categoryID) book.categoryID = values.categoryID; });
  }
};
const sequelize = {
  transaction: async callback => {
    const snapshot = structuredClone({ categories, books });
    try { return await callback(transaction); }
    catch (error) { categories = snapshot.categories; books = snapshot.books; throw error; }
  }
};
require.cache[require.resolve('../src/models')] = { loaded: true, exports: { Category, Book, sequelize } };
require.cache[require.resolve('../src/services/emailService')] = { loaded: true, exports: {} };
require.cache[require.resolve('../src/services/azureStorage')] = { loaded: true, exports: {} };
const { createCategory, deleteCategory, getAdminCategories } = require('../src/controllers/adminController');
const response = () => ({
  statusCode: 200,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; }
});

test('category management preserves books', async context => {
  context.beforeEach(() => {
    categories = [{ catID: 1, name: 'Fiction', slug: 'fiction' }, { catID: 2, name: 'Science', slug: 'science' }];
    books = [{ bookID: 10, categoryID: 1 }, { bookID: 11, categoryID: 1 }];
    failDelete = false;
    locks = [];
  });
  await context.test('creates a normalized category and rejects duplicate slugs', async () => {
    const res = response();
    await createCategory({ body: { name: '  New & Noteworthy  ' } }, res);
    assert.equal(res.statusCode, 201);
    assert.equal(res.body.category.slug, 'new-noteworthy');
    const duplicate = response();
    await createCategory({ body: { name: 'New - Noteworthy' } }, duplicate);
    assert.equal(duplicate.statusCode, 409);
  });
  await context.test('rejects invalid category names', async () => {
    for (const name of ['', '   ', '!!!', 42, 'a'.repeat(101)]) {
      const res = response();
      await createCategory({ body: { name } }, res);
      assert.equal(res.statusCode, 400);
    }
  });
  await context.test('lists full book counts', async () => {
    const res = response();
    await getAdminCategories({}, res);
    assert.deepEqual(res.body.categories.map(category => category.bookCount), [2, 0]);
  });
  await context.test('blocks occupied category deletion without replacement', async () => {
    const res = response();
    await deleteCategory({ params: { id: '1' }, body: {} }, res);
    assert.equal(res.statusCode, 409);
    assert.equal(categories.length, 2);
    assert.ok(books.every(book => book.categoryID === 1));
  });
  await context.test('deletes an empty category without touching books', async () => {
    const res = response();
    await deleteCategory({ params: { id: '2' }, body: {} }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.movedBooks, 0);
    assert.equal(books.length, 2);
  });
  await context.test('moves all books before deletion with ordered locks', async () => {
    const res = response();
    await deleteCategory({ params: { id: '1' }, body: { replacementCategoryID: '2' } }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.movedBooks, 2);
    assert.deepEqual(locks, [1, 2]);
    assert.deepEqual(books, [{ bookID: 10, categoryID: 2 }, { bookID: 11, categoryID: 2 }]);
    assert.deepEqual(categories.map(category => category.catID), [2]);
  });
  await context.test('rejects self, invalid and missing replacements', async () => {
    for (const replacementCategoryID of ['1', '999', 'bad', true, -1]) {
      const res = response();
      await deleteCategory({ params: { id: '1' }, body: { replacementCategoryID } }, res);
      assert.equal(res.statusCode, 400);
      assert.equal(categories.length, 2);
    }
  });
  await context.test('reports missing source categories', async () => {
    const res = response();
    await deleteCategory({ params: { id: '999' }, body: {} }, res);
    assert.equal(res.statusCode, 404);
  });
  await context.test('rolls back reassignment if deletion fails', async () => {
    failDelete = true;
    const res = response();
    await deleteCategory({ params: { id: '1' }, body: { replacementCategoryID: 2 } }, res);
    assert.equal(res.statusCode, 500);
    assert.equal(categories.length, 2);
    assert.ok(books.every(book => book.categoryID === 1));
  });
});