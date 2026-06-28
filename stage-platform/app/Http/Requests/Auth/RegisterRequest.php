<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest{
    public function authorize() { return true; }
    public function rules(){
        return [
            'nom' => 'required|string|max:255',
            'prenom' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'password' => 'required|string|min:6|confirmed',
            'role' => 'required|in:etudiant,recruteur,admin',
            'entreprise_id' => 'required_if:role,recruteur|exists:entreprises,idEntreprise',
            'poste' => 'required_if:role,recruteur|string',
        ];
    }
}