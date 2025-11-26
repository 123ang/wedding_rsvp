import WeddingDetailsSimple from '../components/WeddingDetailsSimple';
import RSVPFormSimple from '../components/RSVPFormSimple';
import { submitBrideRSVP } from '../services/api';
import './WeddingPage.css';

const BridePageSimple = () => {
  const brideDetails = {
    name: "张美丽",
    date: "2024年12月15日 星期六",
    time: "下午3:00",
    venue: "花园天堂大厅",
    address: "玫瑰街123号，美丽城市，BC 12345",
    description: "加入我们庆祝新娘的特殊日子，与家人和朋友一起。我们期待与您分享这个欢乐的时刻！"
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
          <h1 className="hero-title">新娘的婚礼</h1>
          <p className="hero-subtitle">爱与喜悦的庆典</p>
        </div>
        
        <div className="content-section">
          <WeddingDetailsSimple 
            title="婚礼详情" 
            details={brideDetails}
            mapUrl={brideMapUrl}
            contact={brideContact}
            wazeUrl={brideWazeUrl}
            googleMapsUrl={brideGoogleMapsUrl}
          />
          
          <div className="invitation-section">
            <a className="download-button" href="/invitation_pdf/bride_invitation.pdf" download>
              下载新娘请柬（PDF）
            </a>
          </div>
          
          <RSVPFormSimple 
            onSubmit={handleSubmit}
            title="新娘婚礼回复"
          />
        </div>
      </div>
    </div>
  );
};

export default BridePageSimple;
