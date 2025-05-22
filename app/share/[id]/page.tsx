'use client';

import { useParams } from 'next/navigation';

export default function SharePage() {
  const params = useParams();
  const id = params.id;

  return (
    <div className="p-10">
      <h2 className="text-xl mb-4">Download File</h2>
      <p>
        This is where file download logic for ID: {id} would be implemented.
      </p>
    </div>
  );
}
