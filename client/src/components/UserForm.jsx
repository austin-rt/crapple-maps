export default function UserForm() {
  return (
    <form>
      <label htmlFor="username">username:</label>
      <input type="text" placeholder="username" required></input>
      <label htmlFor="username">first name:</label>
      <input type="text" placeholder="first name" required></input>
      <label htmlFor="username">last name:</label>
      <input type="text" placeholder="last name" required></input>
      <label htmlFor="username">email:</label>
      <input type="text" placeholder="email" required></input>
      <label htmlFor="username">city:</label>
      <input type="text" placeholder="city" required></input>
      <input type="submit" className="button" />
    </form>
  );
};;