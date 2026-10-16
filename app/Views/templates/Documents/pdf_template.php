<!DOCTYPE html>
<html lang="th">

<head>
    <meta charset="UTF-8">
    <style>
        body {
            /* font-family: 'TH Sarabun New', sans-serif; */
            font-family: "thsarabunnew";
            margin: 80px;
            font-size: 12pt;
        }

        h2 {
            text-align: center;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 0px;
        }

        th,
        td {
            border: 1px solid #999;
            padding: 6px 10px;
            text-align: center;
        }

        th.label,
        td.label {
            text-align: left;
        }

        .section-title {
            margin-top: 15px;
            font-weight: bold;
        }

        @media print {
            .export-buttons {
                display: none !important;
            }

            body {
                margin: 0;
                padding: 15px;
            }

            /* ปรับขนาดกราฟสำหรับการพิมพ์ */
            canvas {
                max-width: 100% !important;
                height: auto !important;
            }

            /* จัดการตารางในหน้าพิมพ์ */
            table {
                page-break-inside: auto;
            }

            tr {
                page-break-inside: avoid;
                page-break-after: auto;
            }
        }

        /* สีพื้นหลังสำหรับคอลัมน์ */
        .column-head {
            background-color: rgba(145, 72, 191, 0.1);
        }

        /* สีฟ้าอ่อน */


        /* สีสำหรับยอดรวม */
        .column-total {
            background-color: rgba(20, 68, 140, 0.1);
            font-weight: bold;
        }

        /* ปรับสีเมื่อ hover */
        td:hover {
            opacity: 0.9;
            transition: all 0.3s;
        }
    </style>

</head>

<body>

    <p style="text-align:center;font-weight: bold;">
        <?= 'เปรียบเทียบเพื่อหาความเสี่ยง สถานะเงินกู้ ณ ' . ($date_thai ?? '') ?>
    </p>
    <div class="section-title">1. ข้อมูลแบ่งตามประเภทเงินกู้</div>
    <table>
        <thead>
            <tr class="column-head">
                <th style="text-align: center; font-weight: bold;">ประเภทเงินกู้</th>
                <th style="text-align: center; font-weight: bold;">หนี้คงเหลือ</th>
                <th style="text-align: center; font-weight: bold;">อัตราร้อยละ</th>
            </tr>
        </thead>
        <tbody>
            <tr class="column-emer">
                <td class="label">เงินกู้เพื่อเหตุฉุกเฉิน</td>
                <td><?= number_format($amount1) ?></td>
                <td><?= number_format(($amount1 / $sum_amount) * 100, 2) ?>%</td>
            </tr>
            <tr class="column-regular">
                <td class="label">เงินกู้สามัญ (ใช้หุ้น/เงินฝากค้ำ)</td>
                <td><?= number_format($amount2) ?></td>
                <td><?= number_format(($amount2 / $sum_amount) * 100, 2) ?>%</td>
            </tr>
            <tr class="column-special">
                <td class="label">เงินกู้พิเศษ (เคหะ)</td>
                <td><?= number_format($amount3) ?></td>
                <td><?= number_format(($amount3 / $sum_amount) * 100, 2) ?>%</td>
            </tr>
            <tr class="column-personal">
                <td class="label">เงินกู้ที่ใช้บุคคลค้ำ</td>
                <td><?= number_format($amount4) ?></td>
                <td><?= number_format(($amount4 / $sum_amount) * 100, 2) ?>%</td>
            </tr>
            <tr class="column-total">
                <td class="label"><strong>รวม</strong></td>
                <td><strong><?= number_format($sum_amount) ?></strong></td>
                <td><strong><?= number_format(($sum_amount / $sum_amount) * 100, 2) ?>%</strong></td>
            </tr>
        </tbody>
    </table>

    <div class="section-title">2. จํานวนหุ้นทั้งหมดของสมาชิกผู้กู้ที่ใช้บุคคลค้ำประกัน
        <?= number_format($shr_sum_bth) ?>
    </div>

    <?php
    function percent($value, $total)
    {
        return $total > 0 ? number_format(($value / $total) * 100, 2) . '%' : '0.00%';
    }
    ?>


    <div class="section-title">3. เงินกู้ที่ใช้บุคคลค้ำประกัน</div>
    <table>
        <thead>
            <tr class="column-head">
                <th style="text-align: center; font-weight: bold;">ประเภทเงินกู้</th>
                <th style="text-align: center; font-weight: bold;">เงินกู้พัฒนาคุณภาพชีวิต</th>
                <th style="text-align: center; font-weight: bold;">สามัญฟ้า</th>
                <th style="text-align: center; font-weight: bold;">น้ำท่วม</th>
                <th style="text-align: center; font-weight: bold;">วิกฤตโควิด</th>
                <th style="text-align: center; font-weight: bold;">รวมยอดทั้งหมด</th>


            </tr>
        </thead>
        <tbody>
            <tr>
                <td>สัญญาที่รับภาระค้ำประกัน<br><span
                        class="percent-cell">คิดเป็นร้อยละของเงินกู้รวมที่ใช้คนค้ำประกัน</span></td>
                <td><?= number_format($re[0]) ?><br><span
                        class="percent-cell"><?= percent($re[0], $sum_all_total) ?></span></td>
                <td><?= number_format($re[1]) ?><br><span
                        class="percent-cell"><?= percent($re[1], $sum_all_total) ?></span></td>
                <td><?= number_format($re[2]) ?><br><span
                        class="percent-cell"><?= percent($re[2], $sum_all_total) ?></span></td>
                <td><?= number_format($re[3]) ?><br><span
                        class="percent-cell"><?= percent($re[3], $sum_all_total) ?></span></td>
                <td><strong><?= number_format(array_sum($re)) ?><br><?= percent(array_sum($re), $sum_all_total) ?></strong>
                </td>
            </tr>


            <tr>
                <td>สัญญาตนเอง<br><span class="percent-cell">คิดเป็นร้อยละของเงินกู้รวมที่ใช้คนค้ำประกัน</span></td>
                <td><?= number_format($main[0]) ?><br><span
                        class="percent-cell"><?= percent($main[0], $sum_all_total) ?></span></td>
                <td><?= number_format($main[1]) ?><br><span
                        class="percent-cell"><?= percent($main[1], $sum_all_total) ?></span></td>
                <td><?= number_format($main[2]) ?><br><span
                        class="percent-cell"><?= percent($main[2], $sum_all_total) ?></span></td>
                <td><?= number_format($main[3]) ?><br><span
                        class="percent-cell"><?= percent($main[3], $sum_all_total) ?></span></td>
                <td><strong><?= number_format(array_sum($main)) ?><br><?= percent(array_sum($main), $sum_all_total) ?></strong>
                </td>
            </tr>

            <tr class="column-total">
                <!--ยอด รับภาระค้ำประกัน+สัญญาตนเอง -->
                <td><strong>รวม<br><span
                            class="percent-cell">คิดเป็นร้อยละของเงินกู้รวมที่ใช้คนค้ำประกัน</span></strong></td>
                </td>
                <td><strong><?= number_format($re[0] + $main[0]) ?><br><span
                            class="percent-cell"><?= percent($re[0] + $main[0], $sum_all_total) ?></span></strong></td>
                <td><strong><?= number_format($re[1] + $main[1]) ?><br><span
                            class="percent-cell"><?= percent($re[1] + $main[1], $sum_all_total) ?></span></strong></td>
                <td><strong><?= number_format($re[2] + $main[2]) ?><br><span
                            class="percent-cell"><?= percent($re[2] + $main[2], $sum_all_total) ?></span></strong></td>
                <td><strong><?= number_format($re[3] + $main[3]) ?><br><span
                            class="percent-cell"><?= percent($re[3] + $main[3], $sum_all_total) ?></span></strong></td>
                <td><strong><?= number_format(array_sum($main) + array_sum($re)) ?><br><?= number_format(($sum_all_total / $sum_all_total) * 100, 2) ?>%</strong>
                </td>
            </tr>

        </tbody>
    </table>