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
          />
          
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
