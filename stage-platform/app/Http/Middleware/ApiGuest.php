<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class ApiGuest
{
    public function handle(Request $request, Closure $next)
    {
        // Ne rien faire, juste passer la requête
        return $next($request);
    }
}