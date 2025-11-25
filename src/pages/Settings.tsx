import { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import Header from '../components/layout/Header';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useSettings, useUpdateSettings } from '../hooks/useSettings';
import { exportAllData, validateEmail } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { Save, Download, Building2, FileText, Briefcase, Upload, X, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import type { BusinessInfo, InvoiceSettings, ProjectSettings } from '../types/database';

interface OutletContext {
  onMenuClick: () => void;
}

const Settings = () => {
  const { onMenuClick } = useOutletContext<OutletContext>();
  
  // Fetch settings
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();

  // Form state
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({
    name: '',
    email: '',
    phone: '',
    bank_name: '',
    bank: '',
    account: '',
    branch: '',
    account_type: '',
  });

  const [invoiceSettings, setInvoiceSettings] = useState<InvoiceSettings>({
    prefix: 'MZK',
    payment_terms: 30,
  });

  const [projectSettings, setProjectSettings] = useState<ProjectSettings>({
    default_support_months: 6,
  });

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isExporting, setIsExporting] = useState(false);
  
  // Logo upload state
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load settings when data is available
  useEffect(() => {
    if (settings) {
      if (settings.business_info) {
        setBusinessInfo(settings.business_info);
        if (settings.business_info.logo_url) {
          setLogoPreview(settings.business_info.logo_url);
        }
      }
      if (settings.invoice_settings) {
        setInvoiceSettings(settings.invoice_settings);
      }
      if (settings.project_settings) {
        setProjectSettings(settings.project_settings);
      }
    }
  }, [settings]);

  // Handle logo file selection
  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be less than 2MB');
      return;
    }

    setLogoFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle logo upload
  const handleLogoUpload = async () => {
    if (!logoFile) return;

    setIsUploadingLogo(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create unique filename
      const fileExt = logoFile.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filePath, logoFile, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(filePath);

      // Update business info with logo URL
      const updatedBusinessInfo = { ...businessInfo, logo_url: publicUrl };
      setBusinessInfo(updatedBusinessInfo);

      // Save to database
      await updateSettings.mutateAsync([
        { key: 'business_info', value: updatedBusinessInfo },
      ]);

      toast.success('Logo uploaded successfully');
      setLogoFile(null);
    } catch (error) {
      console.error('Logo upload error:', error);
      toast.error('Failed to upload logo');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // Handle logo removal
  const handleLogoRemove = async () => {
    try {
      const updatedBusinessInfo = { ...businessInfo, logo_url: '' };
      setBusinessInfo(updatedBusinessInfo);
      setLogoPreview('');
      setLogoFile(null);

      await updateSettings.mutateAsync([
        { key: 'business_info', value: updatedBusinessInfo },
      ]);

      toast.success('Logo removed successfully');
    } catch (error) {
      console.error('Logo removal error:', error);
      toast.error('Failed to remove logo');
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate business email
    if (businessInfo.email && !validateEmail(businessInfo.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Validate payment terms
    if (invoiceSettings.payment_terms < 0 || invoiceSettings.payment_terms > 365) {
      newErrors.payment_terms = 'Payment terms must be between 0 and 365 days';
    }

    // Validate default support months
    if (projectSettings.default_support_months < 0 || projectSettings.default_support_months > 60) {
      newErrors.default_support_months = 'Support months must be between 0 and 60';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle save
  const handleSave = async () => {
    if (!validateForm()) {
      toast.error('Please fix validation errors');
      return;
    }

    try {
      await updateSettings.mutateAsync([
        { key: 'business_info', value: businessInfo },
        { key: 'invoice_settings', value: invoiceSettings },
        { key: 'project_settings', value: projectSettings },
      ]);
      // Success toast is handled in the hook
    } catch (error) {
      // Error toast is handled in the hook
    }
  };

  // Handle data export
  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportAllData();
      toast.success('Data exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div>
        <Header title="Settings" onMenuClick={onMenuClick} />
        <div className="p-6">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-[#7f8c8d]">Loading settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title="Settings" onMenuClick={onMenuClick} />
      <div className="p-6 space-y-6">
        {/* Business Information Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Building2 size={20} className="text-[#ffd166]" />
              <h2 className="text-lg font-semibold text-[#2c3e50]">Business Information</h2>
            </div>
          </div>
          <div className="p-6 space-y-4">
            {/* Logo Upload Section */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-2 text-[#2c3e50]">
                  <ImageIcon size={20} className="text-[#ffd166]" />
                  <h3 className="font-semibold">Company Logo</h3>
                </div>
                
                {logoPreview ? (
                  <div className="relative">
                    <img 
                      src={logoPreview} 
                      alt="Company Logo" 
                      className="max-w-xs max-h-32 object-contain rounded border border-gray-200"
                    />
                    <button
                      onClick={handleLogoRemove}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      aria-label="Remove logo"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="w-48 h-32 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                    <ImageIcon size={48} className="text-gray-400" />
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2 items-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoSelect}
                    className="hidden"
                    aria-label="Select logo file"
                  />
                  <Button
                    variant="secondary"
                    icon={<Upload size={18} />}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingLogo}
                  >
                    Select Logo
                  </Button>
                  {logoFile && (
                    <Button
                      variant="primary"
                      onClick={handleLogoUpload}
                      loading={isUploadingLogo}
                      disabled={isUploadingLogo}
                    >
                      Upload Logo
                    </Button>
                  )}
                </div>
                <p className="text-sm text-[#7f8c8d] text-center">
                  Recommended: PNG or JPG, max 2MB. Logo will appear on invoices and quotations.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                type="text"
                label="Business Name"
                placeholder="Enter business name"
                value={businessInfo.name}
                onChange={(e) => setBusinessInfo({ ...businessInfo, name: e.target.value })}
              />
              <Input
                type="email"
                label="Business Email"
                placeholder="business@example.com"
                value={businessInfo.email}
                onChange={(e) => setBusinessInfo({ ...businessInfo, email: e.target.value })}
                error={errors.email}
              />
              <Input
                type="tel"
                label="Business Phone"
                placeholder="+27 XX XXX XXXX"
                value={businessInfo.phone}
                onChange={(e) => setBusinessInfo({ ...businessInfo, phone: e.target.value })}
              />
              <Input
                type="text"
                label="Bank Name"
                placeholder="Enter bank name"
                value={businessInfo.bank_name}
                onChange={(e) => setBusinessInfo({ ...businessInfo, bank_name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                type="text"
                label="Bank"
                placeholder="Bank code"
                value={businessInfo.bank}
                onChange={(e) => setBusinessInfo({ ...businessInfo, bank: e.target.value })}
              />
              <Input
                type="text"
                label="Account Number"
                placeholder="Account number"
                value={businessInfo.account}
                onChange={(e) => setBusinessInfo({ ...businessInfo, account: e.target.value })}
              />
              <Input
                type="text"
                label="Branch Code"
                placeholder="Branch code"
                value={businessInfo.branch}
                onChange={(e) => setBusinessInfo({ ...businessInfo, branch: e.target.value })}
              />
            </div>
            <Input
              type="text"
              label="Account Type"
              placeholder="e.g., Business Cheque Account"
              value={businessInfo.account_type}
              onChange={(e) => setBusinessInfo({ ...businessInfo, account_type: e.target.value })}
            />
          </div>
        </div>

        {/* Invoice Settings Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <FileText size={20} className="text-[#ffd166]" />
              <h2 className="text-lg font-semibold text-[#2c3e50]">Invoice Settings</h2>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                type="text"
                label="Invoice Prefix"
                placeholder="e.g., MZK"
                value={invoiceSettings.prefix}
                onChange={(e) => setInvoiceSettings({ ...invoiceSettings, prefix: e.target.value.toUpperCase() })}
                helperText="Used in invoice numbers (e.g., MZK-2025-001)"
              />
              <Input
                type="number"
                label="Default Payment Terms (days)"
                placeholder="30"
                value={invoiceSettings.payment_terms}
                onChange={(e) => setInvoiceSettings({ ...invoiceSettings, payment_terms: parseInt(e.target.value) || 0 })}
                error={errors.payment_terms}
                helperText="Number of days until invoice is due"
              />
            </div>
          </div>
        </div>

        {/* Project Settings Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Briefcase size={20} className="text-[#ffd166]" />
              <h2 className="text-lg font-semibold text-[#2c3e50]">Project Settings</h2>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <Input
              type="number"
              label="Default Support Months"
              placeholder="6"
              value={projectSettings.default_support_months}
              onChange={(e) => setProjectSettings({ ...projectSettings, default_support_months: parseInt(e.target.value) || 0 })}
              error={errors.default_support_months}
              helperText="Default support period for new projects"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center bg-white rounded-lg shadow p-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="primary"
              icon={<Save size={18} />}
              onClick={handleSave}
              loading={updateSettings.isPending}
              disabled={updateSettings.isPending}
            >
              Save Settings
            </Button>
            <Button
              variant="secondary"
              icon={<Download size={18} />}
              onClick={handleExport}
              loading={isExporting}
              disabled={isExporting}
            >
              Export Data
            </Button>
          </div>
          <p className="text-sm text-[#7f8c8d]">
            Changes are saved to the database
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
