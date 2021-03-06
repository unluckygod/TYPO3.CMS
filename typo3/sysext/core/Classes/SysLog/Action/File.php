<?php
declare(strict_types = 1);
namespace TYPO3\CMS\Core\SysLog\Action;

/*
 * This file is part of the TYPO3 CMS project.
 *
 * It is free software; you can redistribute it and/or modify it under
 * the terms of the GNU General Public License, either version 2
 * of the License, or any later version.
 *
 * For the full copyright and license information, please read the
 * LICENSE.txt file that was distributed with this source code.
 *
 * The TYPO3 project - inspiring people to share!
 */

/**
 * A class defining possible File actions
 */
class File
{
    public const UPLOAD = 1;
    public const COPY = 2;
    public const MOVE = 3;
    public const DELETE = 4;
    public const RENAME = 5;
    public const NEW_FOLDER = 6;

    /*
     * The constant is not in use but the xlf file tells that 7 represents unzip
     * @see https://github.com/TYPO3/TYPO3.CMS/blob/master/typo3/sysext/belog/Resources/Private/Language/locallang.xlf#L267
     */
    public const UNZIP = 7;
    public const NEW_FILE = 8;
    public const EDIT = 9;
}
