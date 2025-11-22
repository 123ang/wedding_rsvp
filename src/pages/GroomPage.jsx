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

  const groomMapUrl = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3972.0308781434446!2d100.31711257676385!3d5.412268094566927!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x304ac3b8ddc1342b%3A0xd6c5275c4a71cf6c!2sStarview%20Restaurant!5e0!3m2!1sen!2smy!4v1762150890792!5m2!1sen!2smy";
  const groomContact = "+601116473648";
  const groomWazeUrl = "https://waze.com/ul?ll=5.412268,100.317112&navigate=yes&z=10";
  const groomGoogleMapsUrl = "https://maps.google.com/?q=5.412268,100.317112";

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
            mapUrl={groomMapUrl}
            contact={groomContact}
            wazeUrl={groomWazeUrl}
            googleMapsUrl={groomGoogleMapsUrl}
          />
          
          <div className="invitation-section">
            <a className="download-button" href="/invitation_pdf/groom_invitation.pdf" download>
              {t('downloads.groomInvitation')}
            </a>
          </div>
          
          <RSVPForm 
            onSubmit={handleSubmit}
            title={t('rsvp.groomTitle')}
            deadline={t('rsvp.groomDeadline')}
          />
        </div>
      </div>
    </div>
  );
};

export default GroomPage;

