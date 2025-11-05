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

  const brideMapUrl = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3972.4066597824694!2d100.419564!3d5.354750399999999!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x304ac7ceedd3b407%3A0xd5679317fb5f8203!2sFu%20Hotel!5e0!3m2!1sen!2smy!4v1762150837964!5m2!1sen!2smy";
  const brideContact = "+60174907632";
  const brideWazeUrl = "https://waze.com/ul?ll=5.354750,100.419564&navigate=yes&z=10";
  const brideGoogleMapsUrl = "https://maps.google.com/?q=5.354750,100.419564";

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
            mapUrl={brideMapUrl}
            contact={brideContact}
            wazeUrl={brideWazeUrl}
            googleMapsUrl={brideGoogleMapsUrl}
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

