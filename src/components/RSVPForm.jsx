import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './RSVPForm.css';

const RSVPForm = ({ onSubmit, title }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    attending: true,
    number_of_guests: 1,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'radio' ? value === 'true' : value,
    }));
  };

  // Auto-dismiss success message after 5 seconds
  useEffect(() => {
    if (message.type === 'success' && message.text) {
      const timer = setTimeout(() => {
        setMessage({ text: '', type: '' });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      await onSubmit(formData);
      setMessage({ text: t('rsvp.form.success'), type: 'success' });
      setFormData({
        name: '',
        email: '',
        phone: '',
        attending: true,
        number_of_guests: 1,
      });
    } catch (error) {
      console.error('Form submission error:', error);
      setMessage({ 
        text: error.message || t('rsvp.form.error'), 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rsvp-form-container">
      <h3 className="form-title">{title || t('rsvp.title')}</h3>
      <form onSubmit={handleSubmit} className="rsvp-form">
        <div className="form-group">
          <label htmlFor="name">{t('rsvp.form.name')} *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder={t('rsvp.form.namePlaceholder')}
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">{t('rsvp.form.email')} *</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder={t('rsvp.form.emailPlaceholder')}
          />
        </div>

        <div className="form-group">
          <label htmlFor="phone">{t('rsvp.form.phone')}</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder={t('rsvp.form.phonePlaceholder')}
          />
        </div>

        <div className="form-group">
          <label>{t('rsvp.form.attending')} *</label>
          <div className="attendance-buttons">
            <button
              type="button"
              className={`attendance-btn ${formData.attending === true ? 'selected' : ''}`}
              onClick={() => setFormData(prev => ({ ...prev, attending: true }))}
            >
              {t('rsvp.form.attendingYes')}
            </button>
            <button
              type="button"
              className={`attendance-btn ${formData.attending === false ? 'selected' : ''}`}
              onClick={() => setFormData(prev => ({ ...prev, attending: false }))}
            >
              {t('rsvp.form.attendingNo')}
            </button>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="number_of_guests">{t('rsvp.form.numberOfGuests')} *</label>
          <input
            type="number"
            id="number_of_guests"
            name="number_of_guests"
            value={formData.number_of_guests}
            onChange={handleChange}
            min="1"
            max="10"
            required={formData.attending}
            disabled={!formData.attending}
            className={!formData.attending ? 'disabled' : ''}
          />
        </div>

        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? t('rsvp.form.submitting') : t('rsvp.form.submit')}
        </button>
      </form>
    </div>
  );
};

export default RSVPForm;

