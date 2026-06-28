<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller{
    public function index(){
        $notifications = Notification::where('user_id', auth()->id())
            ->orderBy('created_at', 'desc')
            ->get();
            
        return response()->json([
            'data' => $notifications
        ]);
    }

    public function markAsRead($id)
    {
        $notification = Notification::where('user_id', auth()->id())
            ->findOrFail($id);
            
        $notification->update(['est_lu' => true]);
        
        return response()->json(['message' => 'Notification marquée comme lue']);
    }

    public function markAllAsRead()
    {
        Notification::where('user_id', auth()->id())
            ->where('est_lu', false)
            ->update(['est_lu' => true]);
            
        return response()->json(['message' => 'Toutes les notifications ont été marquées comme lues']);
    }

    public function destroy($id)
    {
        $notification = Notification::where('user_id', auth()->id())
            ->findOrFail($id);
            
        $notification->delete();
        
        return response()->json(['message' => 'Notification supprimée']);
    }
}