import Nav from "../components/Nav";
import ListingForm from "../components/ListingForm";

export default function SubmitListing() {

  return (
    <>
      <Nav />
      <h1 className="listing-form-header">Add a Listing</h1>
      <ListingForm />
    </>
  );
}