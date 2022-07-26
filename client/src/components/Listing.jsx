export default function Listing(props) {
  return (
    <div className="listing-container">
      <img src={props.img} className="listing-img" />
      <h2 className="listing-name">{props.name}</h2>
      <h3 className="listing-address-one">{props.streetAddress}</h3>
      <h3 className="listing-address-two">{props.streetAddressTwo}</h3>
      <h4 className="listing-city">{props.city}</h4>
      <p className="listing-state">{props.state}</p>
      <p className="listing-zip">{props.zip}</p>
      {/* <p className="listing-description">{props.description}</p> */}
    </div>
  );
}