<?php

if (!function_exists('formatScore')) {
    function formatScore($score) {
        return number_format($score, 2) . '%';
    }
}