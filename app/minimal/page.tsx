'use client';

export default function Minimal() {
  return (
    <div>
      <h1>Minimal Test</h1>
      <button onClick={() => console.log('clicked')}>
        Console Log Test
      </button>
      <script dangerouslySetInnerHTML={{__html: `
        console.log('Page loaded');
        document.addEventListener('DOMContentLoaded', () => {
          console.log('DOM ready');
        });
      `}} />
    </div>
  );
}