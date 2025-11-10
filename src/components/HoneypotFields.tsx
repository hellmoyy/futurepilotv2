/**
 * Honeypot Component
 * 
 * Invisible fields that trap bots.
 * Humans won't see or fill these fields, but bots often auto-fill everything.
 * 
 * Usage:
 * <HoneypotFields onTrigger={() => setError('Bot detected')} />
 */

'use client';

import { useEffect, useState } from 'react';

interface HoneypotFieldsProps {
  onTrigger?: () => void;
  onChange?: (triggered: boolean) => void;
}

export default function HoneypotFields({ onTrigger, onChange }: HoneypotFieldsProps) {
  const [triggered, setTriggered] = useState(false);
  const [interactionCount, setInteractionCount] = useState(0);

  const handleChange = (fieldName: string, event: React.ChangeEvent<HTMLInputElement>) => {
    // Ignore if the value is empty (browser autofill might set it then clear it)
    if (!event.target.value || event.target.value.trim() === '') {
      return;
    }

    // Increment interaction count
    const newCount = interactionCount + 1;
    setInteractionCount(newCount);

    // Only trigger if multiple fields are filled (real bot behavior)
    // Single field might be autofill accident
    if (newCount >= 2) {
      console.warn(`🤖 Honeypot triggered: Field "${fieldName}" was filled (${newCount} fields total)`);
      setTriggered(true);
      
      if (onTrigger) {
        onTrigger();
      }
      
      if (onChange) {
        onChange(true);
      }
    }
  };

  return (
    <div 
      style={{ 
        position: 'absolute',
        left: '-9999px',
        width: '1px',
        height: '1px',
        opacity: 0,
        pointerEvents: 'none',
      }}
      aria-hidden="true"
    >
      {/* Website field - common bot target */}
      <label htmlFor="website_field">
        Website
        <input
          type="text"
          id="website_field"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          onChange={(e) => handleChange('website', e)}
        />
      </label>

      {/* URL field */}
      <label htmlFor="url_field">
        URL
        <input
          type="url"
          id="url_field"
          name="url"
          tabIndex={-1}
          autoComplete="off"
          onChange={(e) => handleChange('url', e)}
        />
      </label>

      {/* Phone field */}
      <label htmlFor="phone_field">
        Phone
        <input
          type="tel"
          id="phone_field"
          name="phone"
          tabIndex={-1}
          autoComplete="off"
          onChange={(e) => handleChange('phone', e)}
        />
      </label>

      {/* Company field */}
      <label htmlFor="company_field">
        Company
        <input
          type="text"
          id="company_field"
          name="company"
          tabIndex={-1}
          autoComplete="off"
          onChange={(e) => handleChange('company', e)}
        />
      </label>

      {/* Address field */}
      <label htmlFor="address_field">
        Address
        <input
          type="text"
          id="address_field"
          name="address"
          tabIndex={-1}
          autoComplete="off"
          onChange={(e) => handleChange('address', e)}
        />
      </label>

      {/* Zip code field */}
      <label htmlFor="zip_field">
        Zip Code
        <input
          type="text"
          id="zip_field"
          name="zip"
          tabIndex={-1}
          autoComplete="off"
          onChange={(e) => handleChange('zip', e)}
        />
      </label>

      {/* Hidden checkbox - bots often check all boxes */}
      <label htmlFor="subscribe_field">
        <input
          type="checkbox"
          id="subscribe_field"
          name="subscribe_newsletter"
          tabIndex={-1}
          onChange={(e) => handleChange('subscribe_newsletter', e)}
        />
        Subscribe to newsletter
      </label>
    </div>
  );
}

/**
 * Get honeypot field values from FormData
 */
export function getHoneypotValues(formData: FormData): Record<string, string> {
  return {
    website: formData.get('website') as string || '',
    url: formData.get('url') as string || '',
    phone: formData.get('phone') as string || '',
    company: formData.get('company') as string || '',
    address: formData.get('address') as string || '',
    zip: formData.get('zip') as string || '',
    subscribe_newsletter: formData.get('subscribe_newsletter') as string || '',
  };
}

/**
 * Check if any honeypot field is filled
 */
export function checkHoneypot(formData: FormData): boolean {
  const values = getHoneypotValues(formData);
  
  for (const [key, value] of Object.entries(values)) {
    if (value && value !== '' && value !== 'false') {
      console.warn(`🤖 Bot detected: Honeypot field "${key}" = "${value}"`);
      return true; // Bot detected
    }
  }
  
  return false; // Human
}
