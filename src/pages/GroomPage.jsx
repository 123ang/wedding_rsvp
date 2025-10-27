import { useTranslation } from 'react-i18next';
import WeddingDetails from '../components/WeddingDetails';
import WeddingPhoto from '../components/WeddingPhoto';
import RSVPForm from '../components/RSVPForm';
import { submitGroomRSVP } from '../services/api';
import './WeddingPage.css';

const GroomPage = () => {
  const { t } = useTranslation();
  
  const groomDetails = {
    name: t('weddingDetails.groomName'),
    date: t('weddingDetails.groomDate'),
    time: t('weddingDetails.groomTime'),
    venue: t('weddingDetails.groomVenue'),
    address: t('weddingDetails.groomAddress'),
    description: t('weddingDetails.groomDescription')
  };

  const handleSubmit = async (formData) => {
    return await submitGroomRSVP(formData);
  };

  return (
    <div className="wedding-page">
      <div className="page-container">
        <div className="hero-section groom-hero">
          <h1 className="hero-title">{t('hero.groomTitle')}</h1>
          <p className="hero-subtitle">{t('hero.groomSubtitle')}</p>
        </div>
        
        <div className="content-section">
          <WeddingPhoto type="groom" />
          
          <WeddingDetails 
            title={t('weddingDetails.title')} 
            details={groomDetails} 
          />
          
          <RSVPForm 
            onSubmit={handleSubmit}
            title={t('rsvp.groomTitle')}
          />
        </div>
      </div>
    </div>
  );
};

export default GroomPage;

