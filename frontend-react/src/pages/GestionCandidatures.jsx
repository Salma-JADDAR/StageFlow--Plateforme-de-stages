import { useEffect, useState } from 'react';
import { getCandidaturesRecruteur, accepterCandidature, refuserCandidature } from '../api/candidature';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

export default function GestionCandidatures() {
  const [candidatures, setCandidatures] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchCandidatures(); }, []);

  const fetchCandidatures = () => getCandidaturesRecruteur().then(res => setCandidatures(res.data)).finally(() => setLoading(false));

  const handleAccept = async (id) => {
    await accepterCandidature(id);
    toast.success('Candidature acceptée');
    fetchCandidatures();
  };

  const handleRefuse = async (id) => {
    await refuserCandidature(id);
    toast.success('Candidature refusée');
    fetchCandidatures();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Candidatures reçues</h1>
      {candidatures.length === 0 ? <p>Aucune candidature</p> : (
        <div className="space-y-4">
          {candidatures.map(c => (
            <div key={c.idCandidature} className="bg-white p-4 rounded shadow">
              <div className="flex justify-between">
                <div>
                  <p className="font-semibold">{c.etudiant?.user?.nom} {c.etudiant?.user?.prenom}</p>
                  <p className="text-gray-600">Poste : {c.offre?.titre}</p>
                  <p className="text-gray-500 text-sm">Postulé le {new Date(c.dateCandidature).toLocaleDateString()}</p>
                  <p className="mt-2 italic">{c.lettreMotivation}</p>
                </div>
                <div className="flex gap-2 items-start">
                  <button onClick={() => handleAccept(c.idCandidature)} className="bg-green-600 text-white px-3 py-1 rounded">Accepter</button>
                  <button onClick={() => handleRefuse(c.idCandidature)} className="bg-red-600 text-white px-3 py-1 rounded">Refuser</button>
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-500">Statut actuel : {c.statut}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}