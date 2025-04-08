import { useRef, useState } from 'react';
import axios from 'axios';

const CreateEntry = ({ setEntries }) => {
  const modalRef = useRef(null);
  const [{ title, author, image, content }, setForm] = useState({
    title: '',
    author: '',
    image: '',
    content: ''
  });

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    try {
      e.preventDefault();
      if (!author || !image || !content) return alert('Please fill in all fields');
      const { data } = await axios.post(`${import.meta.env.VITE_NOTES_API}/entries`, {
        title,
        author,
        image,
        content
      });
      setEntries(prev => [data, ...prev]);
      setForm({ title: '', author: '', image: '', content: '' });
      modalRef.current.close();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <div className='fixed bottom-4 right-4 z-50'>
        <button
          onClick={() => modalRef.current.showModal()}
          className='btn btn-circle btn-primary text-white shadow-lg'
        >
          +
        </button>
      </div>
      <dialog id='modal-note' className='modal' ref={modalRef}>
        <div className='modal-box h-[500px]'>
          <div className='modal-action justify-between mb-2'>
            <h1 className='text-2xl text-center'>Create a new note</h1>
            <form method='dialog'>
              <button className='btn'>&times;</button>
            </form>
          </div>
          <form className='flex flex-col items-center justify-center gap-2' onSubmit={handleSubmit}>
            <label className='input input-bordered flex items-center w-full'>
              <input
                className='grow'
                placeholder='Title'
                name='title'
                value={title}
                onChange={handleChange}
              />
            </label>
            <label className='input input-bordered flex items-center w-full'>
              <input
                className='grow'
                placeholder='Author'
                name='author'
                value={author}
                onChange={handleChange}
              />
            </label>
            <label className='input input-bordered flex items-center w-full'>
              <input
                className='grow'
                placeholder='Image URL'
                name='image'
                value={image}
                onChange={handleChange}
              />
            </label>
            <div className='label w-full'>
              <textarea
                cols={80}
                rows={10}
                className='textarea textarea-bordered h-24'
                placeholder='Content'
                name='content'
                value={content}
                onChange={handleChange}
              ></textarea>
            </div>

            <button className='btn btn-error text-white'>Create</button>
          </form>
        </div>
      </dialog>
    </>
  );
};

export default CreateEntry;
