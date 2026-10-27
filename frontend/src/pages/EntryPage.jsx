import Entry from "../components/Entry";

function EntryPage({isAuthenticated}) {
  // State to track authentication status

  return (
    <div className='EntryPageage'>
      <Entry/>      
    </div>
  );
}

export default EntryPage;