<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ProfileRequest extends FormRequest
{
    public function authorize() { return true; }
    public function rules()
    {
        return [
            'photo' => 'nullable|url',
            'description' => 'nullable|string',
            'ville' => 'nullable|string',
            'telephone' => 'nullable|string'
        ];
    }
}