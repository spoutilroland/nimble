'use client';

import { useI18n } from '@/lib/i18n/context';

export type FooterFormField = 'phone' | 'email' | 'address' | 'weekdays' | 'saturday' | 'hoursNote' | 'siret' | 'certifications' | 'copyright';

interface BusinessFormProps {
  formData: Record<FooterFormField, string>;
  onFieldChange: (field: FooterFormField, value: string) => void;
}

export function BusinessForm({ formData, onFieldChange }: BusinessFormProps) {
  const { t } = useI18n();

  return (
    <div className="flex flex-col gap-[0.9rem] mt-[0.9rem]">
      <div className="border border-[var(--bo-border)] p-[1.2rem_1.4rem]">
        <h3 className="font-['Plus_Jakarta_Sans',sans-serif] text-[0.8rem] tracking-[0.12em] uppercase text-[var(--bo-green)] m-0 mb-4">{t('footerSection.contactTitle')}</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="form-group">
            <label>{t('footerSection.phoneLabel')}</label>
            <input type="text" value={formData.phone} onChange={(e) => onFieldChange('phone', e.target.value)} />
          </div>
          <div className="form-group">
            <label>{t('footerSection.emailLabel')}</label>
            <input type="email" value={formData.email} onChange={(e) => onFieldChange('email', e.target.value)} />
          </div>
        </div>
        <div className="form-group">
          <label>{t('footerSection.addressLabel')}</label>
          <input type="text" value={formData.address} onChange={(e) => onFieldChange('address', e.target.value)} />
        </div>
      </div>

      <div className="border border-[var(--bo-border)] p-[1.2rem_1.4rem]">
        <h3 className="font-['Plus_Jakarta_Sans',sans-serif] text-[0.8rem] tracking-[0.12em] uppercase text-[var(--bo-green)] m-0 mb-4">{t('footerSection.hoursTitle')}</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="form-group">
            <label>{t('footerSection.weekdaysLabel')}</label>
            <input type="text" value={formData.weekdays} onChange={(e) => onFieldChange('weekdays', e.target.value)} />
          </div>
          <div className="form-group">
            <label>{t('footerSection.saturdayLabel')}</label>
            <input type="text" value={formData.saturday} onChange={(e) => onFieldChange('saturday', e.target.value)} />
          </div>
        </div>
        <div className="form-group">
          <label>{t('footerSection.hoursNoteLabel')}</label>
          <input type="text" value={formData.hoursNote} onChange={(e) => onFieldChange('hoursNote', e.target.value)} />
        </div>
      </div>

      <div className="border border-[var(--bo-border)] p-[1.2rem_1.4rem]">
        <h3 className="font-['Plus_Jakarta_Sans',sans-serif] text-[0.8rem] tracking-[0.12em] uppercase text-[var(--bo-green)] m-0 mb-4">{t('footerSection.legalTitle')}</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="form-group">
            <label>{t('footerSection.siretLabel')}</label>
            <input type="text" value={formData.siret} onChange={(e) => onFieldChange('siret', e.target.value)} />
          </div>
          <div className="form-group">
            <label>{t('footerSection.certificationsLabel')}</label>
            <input type="text" value={formData.certifications} onChange={(e) => onFieldChange('certifications', e.target.value)} />
          </div>
        </div>
        <div className="form-group">
          <label>{t('footerSection.copyrightLabel')}</label>
          <input type="text" value={formData.copyright} onChange={(e) => onFieldChange('copyright', e.target.value)} />
        </div>
      </div>
    </div>
  );
}
