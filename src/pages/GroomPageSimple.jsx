import WeddingDetailsSimple from '../components/WeddingDetailsSimple';
import RSVPFormSimple from '../components/RSVPFormSimple';
import { submitGroomRSVP } from '../services/api';
import './WeddingPage.css';

const GroomPageSimple = () => {
  const groomDetails = {
    name: "李英俊",
    date: "2024年12月16日 星期日",
    time: "下午2:00",
    venue: "大宴会厅酒店",
    address: "橡树大道456号，美丽城市，BC 12345",
    description: "来和我们一起庆祝新郎的婚礼日。这将是一个充满爱、欢笑和珍贵回忆的难忘夜晚！"
  };

  const handleSubmit = async (formData) => {
    return await submitGroomRSVP(formData);
  };

  return (
    <div className="wedding-page">
      <div className="page-container">
        <div className="hero-section groom-hero">
          <h1 className="hero-title">新郎的婚礼</h1>
          <p className="hero-subtitle">值得纪念的一天</p>
        </div>
        
        <div className="content-section">
          <WeddingDetailsSimple 
            title="婚礼详情" 
            details={groomDetails} 
          />
          
          <div className="invitation-section">
            <a className="download-button" href="/invitation_pdf/groom_invitation.pdf" download>
              下载新郎请柬（PDF）
            </a>
          </div>
          
          <RSVPFormSimple 
            onSubmit={handleSubmit}
            title="新郎婚礼回复"
            showOrganization={true}
          />
        </div>
      </div>
    </div>
  );
};

export default GroomPageSimple;
