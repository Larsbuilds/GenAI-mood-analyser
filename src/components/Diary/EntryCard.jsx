const EntryCard = ({ entry }) => {
  const placeholderImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25' viewBox='0 0 800 400'%3E%3Crect width='800' height='400' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='24' fill='%239ca3af'%3ENo image provided%3C/text%3E%3C/svg%3E";

  return (
    <div className='card bg-base-100 shadow-xl'>
      <figure className='bg-white h-48'>
        <img 
          src={entry.image || placeholderImage} 
          alt={entry.title} 
          className='object-cover h-full w-full'
          onError={(e) => {
            e.target.src = placeholderImage;
          }}
        />
      </figure>
      <div className='card-body h-56'>
        <h2 className='card-title'>{entry.title}</h2>
        <h3 className='font-bold'>{new Date(entry.date).toDateString()}</h3>
        <p className='truncate text-wrap'>{entry.content}</p>
      </div>
    </div>
  );
};

export default EntryCard;
