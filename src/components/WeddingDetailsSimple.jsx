import './WeddingDetails.css';

const WeddingDetailsSimple = ({ title, details }) => {
  return (
    <div className="wedding-details">
      <h2 className="details-title">{title}</h2>
      <div className="details-content">
        {details.name && (
          <div className="detail-item">
            <span className="detail-label">姓名:</span>
            <span className="detail-value">{details.name}</span>
          </div>
        )}
        {details.date && (
          <div className="detail-item">
            <span className="detail-label">日期:</span>
            <span className="detail-value">{details.date}</span>
          </div>
        )}
        {details.time && (
          <div className="detail-item">
            <span className="detail-label">时间:</span>
            <span className="detail-value">{details.time}</span>
          </div>
        )}
        {details.venue && (
          <div className="detail-item">
            <span className="detail-label">场地:</span>
            <span className="detail-value">{details.venue}</span>
          </div>
        )}
        {details.address && (
          <div className="detail-item">
            <span className="detail-label">地址:</span>
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

export default WeddingDetailsSimple;
