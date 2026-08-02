import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ShieldCheck, Cloud, Server, Database, Mail, HardDrive } from 'lucide-react';

const Footer = () => {
  return (
    <footer style={{ background: '#0f172a', color: '#94a3b8', paddingTop: '60px', paddingBottom: '30px', marginTop: '80px', borderTop: '1px solid #1e293b' }}>
      <div className="container">
        <div className="grid grid-cols-4 lg-grid-cols-2 md-grid-cols-1 gap-8" style={{ marginBottom: '50px' }}>
          {/* Col 1: Brand */}
          <div>
            <div className="flex items-center gap-3" style={{ marginBottom: '16px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }}>
                <BookOpen size={20} />
              </div>
              <span style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff' }}>
                Book<span style={{ color: '#818cf8' }}>Nest</span>
              </span>
            </div>
            <p style={{ fontSize: '13px', lineHeight: 1.6, marginBottom: '20px', color: '#94a3b8' }}>
              BookNest is a next-generation unified bookstore and book lending platform designed to make reading accessible, seamless, and delightful for everyone.
            </p>
            <div className="flex items-center gap-2" style={{ fontSize: '12px', color: '#38bdf8' }}>
              <ShieldCheck size={16} /> OWASP WAF Protected Platform
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div>
            <h4 style={{ color: '#ffffff', fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>Explore BookNest</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px' }}>
              <li><Link to="/catalogue" style={{ color: '#cbd5e1' }}>Browse Full Catalogue</Link></li>
              <li><Link to="/catalogue?lendable=true" style={{ color: '#cbd5e1' }}>Book Lending Library</Link></li>
              <li><Link to="/tracking" style={{ color: '#cbd5e1' }}>Track Your Order</Link></li>
              <li><Link to="/profile" style={{ color: '#cbd5e1' }}>Member Account & Lendings</Link></li>
            </ul>
          </div>

          {/* Col 3: Book Categories */}
          <div>
            <h4 style={{ color: '#ffffff', fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>Popular Categories</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px' }}>
              <li><Link to="/catalogue?category=technology" style={{ color: '#cbd5e1' }}>Technology & Computing</Link></li>
              <li><Link to="/catalogue?category=sci-fi-fantasy" style={{ color: '#cbd5e1' }}>Sci-Fi & Fantasy</Link></li>
              <li><Link to="/catalogue?category=business" style={{ color: '#cbd5e1' }}>Business & Leadership</Link></li>
              <li><Link to="/catalogue?category=psychology" style={{ color: '#cbd5e1' }}>Psychology & Self-Help</Link></li>
            </ul>
          </div>

          {/* Col 4: Hosting & Infrastructure Stack */}
          <div>
            <h4 style={{ color: '#ffffff', fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>Cloud Architecture</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
              <div className="flex items-center gap-2" style={{ background: '#1e293b', padding: '6px 10px', borderRadius: '6px' }}>
                <Cloud size={14} style={{ color: '#38bdf8' }} />
                <span>Azure App Service (Linux Web App)</span>
              </div>
              <div className="flex items-center gap-2" style={{ background: '#1e293b', padding: '6px 10px', borderRadius: '6px' }}>
                <Server size={14} style={{ color: '#a855f7' }} />
                <span>Azure VM + OWASP ModSecurity WAF</span>
              </div>
              <div className="flex items-center gap-2" style={{ background: '#1e293b', padding: '6px 10px', borderRadius: '6px' }}>
                <Database size={14} style={{ color: '#10b981' }} />
                <span>Azure Database Flexible Server (SQL)</span>
              </div>
              <div className="flex items-center gap-2" style={{ background: '#1e293b', padding: '6px 10px', borderRadius: '6px' }}>
                <HardDrive size={14} style={{ color: '#f59e0b' }} />
                <span>Azure Blob Storage (Media & Invoices)</span>
              </div>
              <div className="flex items-center gap-2" style={{ background: '#1e293b', padding: '6px 10px', borderRadius: '6px' }}>
                <Mail size={14} style={{ color: '#ec4899' }} />
                <span>Azure Email Communication Service</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{ borderTop: '1px solid #1e293b', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, fontSize: '12px' }}>
          <p>© {new Date().getFullYear()} BookNest E-Commerce Platform. Built for IT42023 - E-Commerce CA Project.</p>
          <div className="flex items-center gap-4">
            <span>Google OAuth 2.0</span>
            <span>•</span>
            <span>Sequelize ORM</span>
            <span>•</span>
            <span>Node.js & React</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
