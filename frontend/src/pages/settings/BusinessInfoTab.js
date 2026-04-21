import React from 'react';
import { Building, Image, Upload, Eye } from 'lucide-react';
import SimpleRichTextEditor from '../../components/SimpleRichTextEditor';
import ReceiptPreview from '../../components/ReceiptPreview';

export const BusinessInfoTab = ({ settings, setSettings, uploading, handleFileUpload, fileInputRef }) => {
  return (
    <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
      <h2 style={{ marginBottom: '24px', fontSize: '18px', fontWeight: '600', color: '#374151', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Building size={20} />
        Business Information
      </h2>

      <div className="form-group" style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '15px', fontWeight: '500', color: '#374151' }}>
          Business Name
        </label>
        <div data-testid="business-name-editor">
          <SimpleRichTextEditor
            value={settings.business_name}
            onChange={(html) => setSettings({ ...settings, business_name: html })}
            placeholder="Enter business name"
            rows={1}
          />
        </div>
        <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
          Tip: On the receipt, the blue/red split is applied on top of your formatting (bold/italic/underline/size preserved; custom text color is overridden by the split).
        </p>
      </div>

      <div className="form-group" style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '15px', fontWeight: '500', color: '#374151' }}>
          Address
        </label>
        <div data-testid="business-address-editor">
          <SimpleRichTextEditor
            value={settings.business_address}
            onChange={(html) => setSettings({ ...settings, business_address: html })}
            placeholder="Enter business address"
            rows={2}
          />
        </div>
      </div>

      <div className="form-group" style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '15px', fontWeight: '500', color: '#374151' }}>
          Phone Number
        </label>
        <div data-testid="business-phone-editor">
          <SimpleRichTextEditor
            value={settings.business_phone}
            onChange={(html) => setSettings({ ...settings, business_phone: html })}
            placeholder="Enter phone number"
            rows={1}
          />
        </div>
      </div>

      <div className="form-group" style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '15px', fontWeight: '500', color: '#374151' }}>
          Logo
        </label>

        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '12px',
          flexWrap: 'wrap'
        }}>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
            data-testid="logo-file-input"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              backgroundColor: '#8b5cf6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: uploading ? 'not-allowed' : 'pointer',
              opacity: uploading ? 0.7 : 1
            }}
            data-testid="upload-logo-btn"
          >
            <Upload size={16} />
            {uploading ? 'Uploading...' : 'Upload from Computer'}
          </button>
          <span style={{ fontSize: '13px', color: '#6b7280', alignSelf: 'center' }}>
            or enter URL below
          </span>
        </div>

        <div style={{ position: 'relative' }}>
          <Image size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input
            type="text"
            data-testid="business-logo-input"
            value={settings.business_logo}
            onChange={(e) => setSettings({ ...settings, business_logo: e.target.value })}
            placeholder="https://example.com/logo.png or upload a file above"
            style={{
              width: '100%',
              padding: '12px 16px 12px 40px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '16px'
            }}
          />
        </div>

        <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px' }}>
          Supported formats: JPG, PNG, GIF, WebP, SVG (max 5MB)
        </p>

        {settings.business_logo && (
          <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <p style={{ fontSize: '13px', color: '#6b7280' }}>Logo Preview:</p>
              <button
                type="button"
                onClick={() => setSettings({ ...settings, business_logo: '' })}
                style={{
                  fontSize: '12px',
                  color: '#ef4444',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px 8px'
                }}
              >
                Remove
              </button>
            </div>
            <img
              src={settings.business_logo}
              alt="Logo preview"
              style={{ maxHeight: '80px', maxWidth: '250px', objectFit: 'contain' }}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }}
            />
            <p style={{ display: 'none', fontSize: '13px', color: '#ef4444' }}>
              Failed to load image. Please check the URL.
            </p>
          </div>
        )}
      </div>

      {/* Live Receipt Preview */}
      <div style={{
        marginTop: '24px',
        padding: '20px',
        background: '#f9fafb',
        borderRadius: '10px',
        border: '1px solid #e5e7eb'
      }}>
        <h3 style={{
          fontSize: '15px',
          fontWeight: '600',
          color: '#374151',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '6px'
        }}>
          <Eye size={16} />
          Live Receipt Preview
        </h3>
        <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 8px 0' }}>
          Updates as you type. Reflects the blue/red split and any bold/italic/underline/font-size formatting you apply above.
        </p>
        <ReceiptPreview settings={settings} />
      </div>
    </div>
  );
};

export default BusinessInfoTab;
