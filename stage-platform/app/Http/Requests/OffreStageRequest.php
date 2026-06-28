<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class OffreStageRequest extends FormRequest{
    public function authorize() { return true; }

public function rules(){
    $rules = [
        'titre' => 'sometimes|required|string|max:255',
        'description' => 'sometimes|required|string',
        'ville' => 'sometimes|required|string|max:255',
        'duree' => 'sometimes|required|integer|min:1|max:24',
        'typeStage' => 'sometimes|required|in:PFE,stage été,stage observation,Alternance',
        'dateLimite' => 'sometimes|required|date|after:today',
        'statut' => 'sometimes|in:publiée,archivée,en_attente'
    ];
    
    return $rules;
}
}