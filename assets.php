<?php

$rii = new RecursiveIteratorIterator(new RecursiveDirectoryIterator("assets"));

$paths = array();

foreach ($rii as $file) {
    if ($file->isDir()) continue;

    $paths[] = $file->getPathname();
}

echo json_encode($paths);
