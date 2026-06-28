<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Formation;
use App\Http\Requests\FormationRequest;
use Illuminate\Http\Request;

class FormationController extends Controller{
   
    public function index(){
        $formations = Formation::all();
        return response()->json($formations);
    }

    
public function store(FormationRequest $request){
    $formation = Formation::create([
        'diplome' => $request->diplome,
        'etablissement' => $request->etablissement,
        'niveau' => $request->niveau,
        'anneeDebut' => $request->anneeDebut,
        'anneeFin' => $request->anneeFin,
        'etudiant_id' => auth()->user()->etudiant->idEtudiant 
    ]);
    
    return response()->json($formation, 201);
}

    public function update(FormationRequest $request, $id)
    {
        $formation = Formation::findOrFail($id);
        $formation->update($request->validated());
        return response()->json($formation);
    }

    public function destroy($id)
    {
        $formation = Formation::findOrFail($id);
        $formation->delete();
        return response()->json(['message' => 'Formation supprimée']);
    }
    public function getPredefinedFormations()
{
    // Récupérer les formations qui n'appartiennent à aucun étudiant (formations de base)
    $formations = Formation::whereNull('etudiant_id')->get();
    return response()->json($formations);
}
}