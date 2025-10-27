import { useTranslation } from 'react-i18next';
import './WeddingDetails.css';

const WeddingDetails = ({ title, details }) => {
  const { t } = useTranslation();

  return (
    <div className="wedding-details">
      <h2 className="details-title">{title}</h2>
      <div className="details-content">
        {details.name && (
          <div className="detail-item">
            <span className="detail-label">{t('weddingDetails.name')}:</span>
            <span className="detail-value">{details.name}</span>
          </div>
        )}
        {details.date && (
          <div className="detail-item">
            <span className="detail-label">{t('weddingDetails.date')}:</span>
            <span className="detail-value">{details.date}</span>
          </div>
        )}
        {details.time && (
          <div className="detail-item">
            <span className="detail-label">{t('weddingDetails.time')}:</span>
            <span className="detail-value">{details.time}</span>
          </div>
        )}
        {details.venue && (
          <div className="detail-item">
            <span className="detail-label">{t('weddingDetails.venue')}:</span>
            <span className="detail-value">{details.venue}</span>
          </div>
        )}
        {details.address && (
          <div className="detail-item">
            <span className="detail-label">{t('weddingDetails.address')}:</span>
            <span className="detail-value">{details.address}</span>
          </div>
        )}
        {details.description && (
          <div className="detail-item description">
            <p>{details.description}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WeddingDetails;

