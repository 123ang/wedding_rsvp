import { useState, useEffect } from 'react';
import './RSVPForm.css';

const RSVPFormSimple = ({ onSubmit, title }) => {
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
      setMessage({ text: '谢谢！您的回复已成功提交。', type: 'success' });
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
        text: error.message || '提交回复失败，请重试。', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rsvp-form-container">
      <h3 className="form-title">{title || '回复邀请'}</h3>
      <form onSubmit={handleSubmit} className="rsvp-form">
        <div className="form-group">
          <label htmlFor="name">姓名 *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="请输入您的姓名"
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">邮箱地址 *</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder="请输入您的邮箱"
          />
        </div>

        <div className="form-group">
          <label htmlFor="phone">手机号码</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="请输入您的手机号码"
          />
        </div>

        <div className="form-group">
          <label>您会参加吗？ *</label>
          <div className="radio-group">
            <label className="radio-label">
              <input
                type="radio"
                name="attending"
                value="true"
                checked={formData.attending === true}
                onChange={handleChange}
              />
              <span>是的，我会参加！</span>
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="attending"
                value="false"
                checked={formData.attending === false}
                onChange={handleChange}
              />
              <span>抱歉，我无法参加</span>
            </label>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="number_of_guests">人数 *</label>
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
          {loading ? '提交中...' : '提交'}
        </button>
      </form>
    </div>
  );
};

export default RSVPFormSimple;
