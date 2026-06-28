<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class FormationRequest extends FormRequest
{
    public function authorize() { return true; }
    public function rules()
    {
        return [
            'diplome' => 'required|string',
            'etablissement' => 'required|string',
            'niveau' => 'required|string',
            'anneeDebut' => 'required|integer|min:1990|max:' . (date('Y')+1),
            'anneeFin' => 'required|integer|gte:anneeDebut'
        ];
    }
}