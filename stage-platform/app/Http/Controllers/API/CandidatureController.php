<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Candidature;
use App\Http\Resources\CandidatureResource;

class CandidatureController extends Controller
{
    public function index()
    {
        // Pour admin ou recruteur, déjà géré ailleurs
    }
}