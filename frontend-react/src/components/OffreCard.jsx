import { Link } from 'react-router-dom';
export default function OffreCard({ offre }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
      <h3 className="text-xl font-semibold mb-2">{offre.titre}</h3>
      <p className="text-gray-600 mb-2">{offre.entreprise?.nom}</p>
      <p className="text-gray-500 mb-2">{offre.ville} • {offre.duree} mois</p>
      <p className="text-gray-700 mb-4 line-clamp-2">{offre.description}</p>
      <Link to={`/offres/${offre.idOffre}`} className="text-blue-600 hover:underline">
        Voir détails →
      </Link>
    </div>
  );
}