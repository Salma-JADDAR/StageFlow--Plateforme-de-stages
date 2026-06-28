<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run()
    {
        // Admin
        User::create([
            'nom' => 'Admin',
            'prenom' => 'System',
            'email' => 'admin@ocp.com',
            'password' => bcrypt('admin123'),
            'role' => 'admin',
        ]);

        // 10 étudiants, 5 recruteurs
        User::factory(10)->create(['role' => 'etudiant']);
        User::factory(5)->create(['role' => 'recruteur']);
    }
}