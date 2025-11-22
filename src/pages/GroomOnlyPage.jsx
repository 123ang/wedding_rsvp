import { useTranslation } from 'react-i18next';
import WeddingDetails from '../components/WeddingDetails';
import WeddingPhoto from '../components/WeddingPhoto';
import RSVPForm from '../components/RSVPForm';
import { submitGroomRSVP } from '../services/api';
import './WeddingPage.css';

const GroomOnlyPage = () => {
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
  const groomContact = "+60164226901";
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
            showContactSeparate={true}
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
            showOrganization={true}
            organizationOptions={[
              { code: 'lions_bayan_baru', en: 'Lions Club of Bayan Baru', zh: '峇央峇鲁狮子会' },
              { code: 'penang_lay_buddhist', en: 'Penang Lay Buddhist Society', zh: '槟城佛教居士林' },
              { code: 'ang_si_toon_hong_tong_sm', en: 'Ang Si Toon Hong Tong Semenanjung Malaysia', zh: '马来西亚洪氏燉煌堂' },
              { code: 'ang_si_chong_soo_pw', en: 'Ang Si Chong Soo Province Wellesley', zh: '北马洪氏宗祠燉煌堂' },
              { code: 'chung_cheng_penang', en: 'Chung Cheng School Union Penang', zh: '中正校友会' },
              { code: 'chung_hwa_1981', en: '1981 Chung Hwa Graduates', zh: '1981 中华毕业生' },
              { code: 'tong_shan_1975', en: '1975 Tong Shan Primary Graduates', zh: '1975年同善小学毕业生' },
              { code: 'chinese_commercial_union', en: 'Chinese Commercial Union', zh: '槟华商业联合会' },
              { code: 'anson_road_pasar', en: 'Anson Road Pasar Society', zh: '安顺路巴刹同业公会' },
              { code: 'other', en: 'Others', zh: '其他' }
            ]}
          />
        </div>
      </div>
    </div>
  );
};

export default GroomOnlyPage;





