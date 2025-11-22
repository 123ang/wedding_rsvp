import { useTranslation } from 'react-i18next';
import './WeddingDetails.css';

const WeddingDetails = ({ title, details, mapUrl, contact, wazeUrl, googleMapsUrl, showContactSeparate = false }) => {
  const { t } = useTranslation();

  return (
    <div className="wedding-details">
      <h2 className="details-title">{title}</h2>
      <div className="details-content">
        {details.name && (
          <div className="detail-item">
            <span className="detail-label">{t('weddingDetails.name')}:</span>
            <span className="detail-value">
              {details.name}
              {contact && !showContactSeparate && (
                <a 
                  href={`https://wa.me/${contact.replace(/[^0-9]/g, '')}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="whatsapp-icon-link"
                  title={`WhatsApp: ${contact}`}
                >
                  <svg className="whatsapp-icon-inline" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                </a>
              )}
            </span>
          </div>
        )}
        {contact && showContactSeparate && (
          <div className="detail-item">
            <span className="detail-label">{t('weddingDetails.contact') || 'Contact'}:</span>
            <span className="detail-value">
              <a 
                href={`tel:${contact}`}
                className="contact-phone-link"
              >
                {contact}
              </a>
              <a 
                href={`https://wa.me/${contact.replace(/[^0-9]/g, '')}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="whatsapp-icon-link"
                title={`WhatsApp: ${contact}`}
              >
                <svg className="whatsapp-icon-inline" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
              </a>
            </span>
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
        {mapUrl && (
          <div className="detail-item map-container">
            <div className="map-wrapper">
              <iframe
                src={mapUrl}
                width="100%"
                height="450"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="map-iframe"
                title="Location Map"
              ></iframe>
            </div>
            <div className="map-actions">
              {wazeUrl && (
                <a 
                  href={wazeUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="map-action-btn waze-btn"
                >
                  <svg className="map-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.99 0C5.372 0 0 5.372 0 12c0 6.628 5.372 12 11.99 12 6.628 0 12.01-5.372 12.01-12 0-6.628-5.382-12-12.01-12zm0 21.54c-5.26 0-9.54-4.28-9.54-9.54 0-5.26 4.28-9.54 9.54-9.54 5.26 0 9.54 4.28 9.54 9.54 0 5.26-4.28 9.54-9.54 9.54zm4.356-11.89c.74 0 1.342.602 1.342 1.342v2.684c0 .74-.602 1.342-1.342 1.342H7.644a1.344 1.344 0 01-1.342-1.342v-2.684c0-.74.602-1.342 1.342-1.342h8.712zm-6.698.894a.895.895 0 100 1.788.895.895 0 000-1.788zm4.684 0a.895.895 0 100 1.788.895.895 0 000-1.788z"/>
                  </svg>
                  Open in Waze
                </a>
              )}
              {googleMapsUrl && (
                <a 
                  href={googleMapsUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="map-action-btn gmaps-btn"
                >
                  <svg className="map-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C7.802 0 4.403 3.399 4.403 7.597c0 5.621 7.597 16.403 7.597 16.403s7.597-10.782 7.597-16.403C19.597 3.399 16.198 0 12 0zm0 10.5a2.903 2.903 0 110-5.806 2.903 2.903 0 010 5.806z"/>
                  </svg>
                  Open in Google Maps
                </a>
              )}
            </div>
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

