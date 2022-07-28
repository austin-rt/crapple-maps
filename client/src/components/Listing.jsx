export default function Listing(props) {
  return (
    <>
      <div className="listing-container">
        <img src={props.img} className="listing-img" />
        <div className="listing-info-container">
          <div className="listing-info-header">
            <h2 className="listing-name">{props.name}</h2>
            <h3 className="listing-rating">{props.overallRating}⭑</h3>
          </div>
          <h3 className="listing-address">{props.streetAddress} {props.streetAddressTwo} </h3>
          <h4 className="listing-city">{props.city}, {props.state} {props.zip} </h4>
        </div>
      </div>
    </>
  );
}