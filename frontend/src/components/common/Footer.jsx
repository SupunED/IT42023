import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';

const Footer = () => {
  return (
    <footer style={{ background: 'var(--primary-light)', color: 'var(--text-muted)', paddingTop: '48px', paddingBottom: '28px', marginTop: 'auto', borderTop: '1px solid var(--border)' }}>
      <div className="container">
        <div className="grid grid-cols-3 md-grid-cols-1 gap-8" style={{ marginBottom: '40px' }}>
          {/* Col 1: Brand */}
          <div>
            <div className="flex items-center gap-3" style={{ marginBottom: '14px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }}>
                <BookOpen size={19} />
              </div>
              <span style={{ fontSize: '19px', fontWeight: 700, color: 'var(--text-main)' }}>BookNest</span>
            </div>
            <p style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--text-muted)', maxWidth: '320px' }}>
              A unified bookstore and lending platform built to make reading simple and accessible.
            </p>
          </div>

          {/* Col 2: Quick Links */}
          <div>
            <h4 style={{ color: 'var(--text-main)', fontSize: '14px', fontWeight: 600, marginBottom: '14px' }}>Explore</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px' }}>
              <li><Link to="/catalogue" style={{ color: 'var(--text-muted)' }}>Browse Catalogue</Link></li>
              <li><Link to="/catalogue?lendable=true" style={{ color: 'var(--text-muted)' }}>Lending Library</Link></li>
              <li><Link to="/tracking" style={{ color: 'var(--text-muted)' }}>Track Your Order</Link></li>
              <li><Link to="/profile" style={{ color: 'var(--text-muted)' }}>My Account</Link></li>
            </ul>
          </div>

          {/* Col 3: Book Categories */}
          <div>
            <h4 style={{ color: 'var(--text-main)', fontSize: '14px', fontWeight: 600, marginBottom: '14px' }}>Categories</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px' }}>
              <li><Link to="/catalogue?category=technology" style={{ color: 'var(--text-muted)' }}>Technology</Link></li>
              <li><Link to="/catalogue?category=sci-fi-fantasy" style={{ color: 'var(--text-muted)' }}>Sci-Fi & Fantasy</Link></li>
              <li><Link to="/catalogue?category=business" style={{ color: 'var(--text-muted)' }}>Business</Link></li>
              <li><Link to="/catalogue?category=psychology" style={{ color: 'var(--text-muted)' }}>Psychology</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '20px', fontSize: '12px', color: 'var(--text-light)' }}>
          <p>© {new Date().getFullYear()} BookNest. Built for IT42023 - E-Commerce CA Project.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
