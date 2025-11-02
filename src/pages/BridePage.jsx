import { useTranslation } from 'react-i18next';
import WeddingDetails from '../components/WeddingDetails';
import WeddingPhoto from '../components/WeddingPhoto';
import RSVPForm from '../components/RSVPForm';
import { submitBrideRSVP } from '../services/api';
import './WeddingPage.css';

const BridePage = () => {
  const { t } = useTranslation();
  
  const brideDetails = {
    name: t('weddingDetails.brideName'),
    date: t('weddingDetails.brideDate'),
    time: t('weddingDetails.brideTime'),
    venue: t('weddingDetails.brideVenue'),
    address: t('weddingDetails.brideAddress'),
    description: t('weddingDetails.brideDescription')
  };

  const handleSubmit = async (formData) => {
    return await submitBrideRSVP(formData);
  };

  return (
    <div className="wedding-page">
      <div className="page-container">
        <div className="hero-section bride-hero">
          <h1 className="hero-title">{t('hero.brideTitle')}</h1>
          <p className="hero-subtitle">{t('hero.brideSubtitle')}</p>
        </div>
        
        <div className="content-section">
          <WeddingPhoto type="bride" />
          
          <WeddingDetails 
            title={t('weddingDetails.title')} 
            details={brideDetails} 
          />
          
          <div className="invitation-section">
            <a className="download-button" href="/invitation_pdf/bride_invitation.pdf" download>
              {t('downloads.brideInvitation')}
            </a>
          </div>
          
          <RSVPForm 
            onSubmit={handleSubmit}
            title={t('rsvp.brideTitle')}
          />
        </div>
      </div>
    </div>
  );
};

export default BridePage;

