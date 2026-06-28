<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Models\User;
use App\Models\Etudiant;
use App\Models\Recruteur;
use App\Models\Administrateur;
use App\Models\Entreprise;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;

class AuthController extends Controller{
    public function register(RegisterRequest $request){
        $user = User::create([
            'nom' => $request->nom,
            'prenom' => $request->prenom,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
        ]);

        if ($request->role === 'etudiant') {
            Etudiant::create(['user_id' => $user->id]);
        } elseif ($request->role === 'recruteur') {
            $entreprise = Entreprise::findOrFail($request->entreprise_id);
            Recruteur::create([
                'user_id' => $user->id,
                'entreprise_id' => $entreprise->idEntreprise,
                'poste' => $request->poste
            ]);
        } elseif ($request->role === 'admin') {
            Administrateur::create(['user_id' => $user->id]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token
        ], 201);
    }

    public function login(LoginRequest $request){
        if (!Auth::attempt($request->only('email', 'password'))) {
            return response()->json(['message' => 'Identifiants invalides'], 401);
        }

        $user = User::where('email', $request->email)->firstOrFail();
        $user->dernierAcces = now();
        $user->save();

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user' => new \App\Http\Resources\UserResource($user),
            'token' => $token
        ]);
    }

    public function logout(){
        auth()->user()->tokens()->delete();
        return response()->json(['message' => 'Déconnecté']);
    }

    public function me()
    {
        return new \App\Http\Resources\UserResource(auth()->user());
    }

    public function update(Request $request){
        $user = auth()->user();
        
        $validated = $request->validate([
            'nom' => 'sometimes|string|max:255',
            'prenom' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $user->id,
        ]);
        
        $user->update($validated);
        
        \Log::info('User updated', ['user_id' => $user->id, 'data' => $validated]);
        
        return response()->json([
            'success' => true,
            'data' => $user
        ]);
    }
}