import { getAccessToken } from './auth';
import { Product, SaleRecord, MonthlySummary } from '../types';

export interface SheetCreationResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
}

export const TAB_PRODUCTS = 'Products';
export const TAB_SALES = 'Daily_Sales';
export const TAB_MONTHLY = 'Monthly_Summary';

/**
 * Creates a dedicated Google Sheet formatted for Product Inventory, Daily Sales, and Monthly Profit/Loss.
 */
export async function createGoogleSheet(title = 'Product Stock & Profit Ledger (প্রোডাক্ট স্টক ও লাভ খাতা)'): Promise<SheetCreationResult> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Google Sheets এ প্রবেশের অনুমতি নেই। অনুগ্রহ করে প্রথমে গুগল একাউন্টে সাইন ইন করুন।');
  }

  const payload = {
    properties: {
      title,
      autoRecalc: 'ON_CHANGE',
    },
    sheets: [
      {
        properties: {
          title: TAB_PRODUCTS,
          tabColorStyle: { rgbColor: { red: 0.059, green: 0.65, blue: 0.45 } },
          gridProperties: { rowCount: 200, columnCount: 12, frozenRowCount: 1 },
        },
      },
      {
        properties: {
          title: TAB_SALES,
          tabColorStyle: { rgbColor: { red: 0.15, green: 0.45, blue: 0.85 } },
          gridProperties: { rowCount: 1000, columnCount: 12, frozenRowCount: 1 },
        },
      },
      {
        properties: {
          title: TAB_MONTHLY,
          tabColorStyle: { rgbColor: { red: 0.1, green: 0.6, blue: 0.65 } },
          gridProperties: { rowCount: 100, columnCount: 10, frozenRowCount: 1 },
        },
      },
    ],
  };

  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error?.message || `গুগল শিট তৈরি ব্যর্থ হয়েছে (${response.status})`);
  }

  const data = await response.json();
  const spreadsheetId = data.spreadsheetId;
  const spreadsheetUrl = data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  return { spreadsheetId, spreadsheetUrl };
}

/**
 * Ensures that the required tabs (Products, Daily_Sales, Monthly_Summary) exist in the spreadsheet.
 */
async function ensureSpreadsheetTabs(spreadsheetId: string, token: string): Promise<Record<string, number>> {
  const metaRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties(sheetId,title)`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!metaRes.ok) {
    const errData = await metaRes.json().catch(() => ({}));
    throw new Error(errData.error?.message || `শিটের তথ্য পড়তে ব্যর্থ হয়েছে (${metaRes.status})`);
  }

  const metaData = await metaRes.json();
  const sheets: Array<{ sheetId: number; title: string }> = (metaData.sheets || []).map((s: any) => s.properties);
  const titles = sheets.map((s) => s.title);

  const requests: any[] = [];
  const sheetIdMap: Record<string, number> = {};

  sheets.forEach((s) => {
    sheetIdMap[s.title] = s.sheetId;
  });

  // Check Products
  const oldProductsTab = sheets.find((s) => s.title === 'পণ্য ও স্টক (Products)' || s.title === 'Sheet1');
  if (!titles.includes(TAB_PRODUCTS)) {
    if (oldProductsTab) {
      requests.push({
        updateSheetProperties: {
          properties: {
            sheetId: oldProductsTab.sheetId,
            title: TAB_PRODUCTS,
            tabColorStyle: { rgbColor: { red: 0.059, green: 0.65, blue: 0.45 } },
          },
          fields: 'title,tabColorStyle',
        },
      });
      sheetIdMap[TAB_PRODUCTS] = oldProductsTab.sheetId;
      titles.push(TAB_PRODUCTS);
    } else {
      const newSheetId = Math.floor(Math.random() * 900000) + 100000;
      requests.push({
        addSheet: {
          properties: {
            sheetId: newSheetId,
            title: TAB_PRODUCTS,
            tabColorStyle: { rgbColor: { red: 0.059, green: 0.65, blue: 0.45 } },
            gridProperties: { frozenRowCount: 1 },
          },
        },
      });
      sheetIdMap[TAB_PRODUCTS] = newSheetId;
      titles.push(TAB_PRODUCTS);
    }
  }

  // Check Daily Sales
  const oldSalesTab = sheets.find((s) => s.title === 'দৈনিক বিক্রয় (Daily Sales)');
  if (!titles.includes(TAB_SALES)) {
    if (oldSalesTab) {
      requests.push({
        updateSheetProperties: {
          properties: {
            sheetId: oldSalesTab.sheetId,
            title: TAB_SALES,
            tabColorStyle: { rgbColor: { red: 0.15, green: 0.45, blue: 0.85 } },
          },
          fields: 'title,tabColorStyle',
        },
      });
      sheetIdMap[TAB_SALES] = oldSalesTab.sheetId;
      titles.push(TAB_SALES);
    } else {
      const newSheetId = Math.floor(Math.random() * 900000) + 100000;
      requests.push({
        addSheet: {
          properties: {
            sheetId: newSheetId,
            title: TAB_SALES,
            tabColorStyle: { rgbColor: { red: 0.15, green: 0.45, blue: 0.85 } },
            gridProperties: { frozenRowCount: 1 },
          },
        },
      });
      sheetIdMap[TAB_SALES] = newSheetId;
      titles.push(TAB_SALES);
    }
  }

  // Check Monthly Summary
  const oldMonthlyTab = sheets.find((s) => s.title === 'মাসিক লাভ-ক্ষতি (Monthly Summary)');
  if (!titles.includes(TAB_MONTHLY)) {
    if (oldMonthlyTab) {
      requests.push({
        updateSheetProperties: {
          properties: {
            sheetId: oldMonthlyTab.sheetId,
            title: TAB_MONTHLY,
            tabColorStyle: { rgbColor: { red: 0.1, green: 0.6, blue: 0.65 } },
          },
          fields: 'title,tabColorStyle',
        },
      });
      sheetIdMap[TAB_MONTHLY] = oldMonthlyTab.sheetId;
      titles.push(TAB_MONTHLY);
    } else {
      const newSheetId = Math.floor(Math.random() * 900000) + 100000;
      requests.push({
        addSheet: {
          properties: {
            sheetId: newSheetId,
            title: TAB_MONTHLY,
            tabColorStyle: { rgbColor: { red: 0.1, green: 0.6, blue: 0.65 } },
            gridProperties: { frozenRowCount: 1 },
          },
        },
      });
      sheetIdMap[TAB_MONTHLY] = newSheetId;
      titles.push(TAB_MONTHLY);
    }
  }

  if (requests.length > 0) {
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requests }),
    });
  }

  return sheetIdMap;
}

/**
 * Applies a gorgeous, polished visual theme directly into Google Sheets:
 * - Emerald & Navy header styling with white text
 * - Clean alternating rows (zebra striping)
 * - Soft borders
 * - Auto-resized column widths
 * - Frozen top header row
 */
async function applyBeautifulSheetTheme(
  spreadsheetId: string,
  token: string,
  sheetIdMap: Record<string, number>,
  productRowsCount: number,
  salesRowsCount: number,
  monthlyRowsCount: number
): Promise<void> {
  const requests: any[] = [];

  const softBorder = {
    style: 'SOLID',
    color: { red: 0.85, green: 0.88, blue: 0.92 },
  };

  // 1. Format Products Tab
  const productsSheetId = sheetIdMap[TAB_PRODUCTS];
  if (productsSheetId !== undefined) {
    const totalRows = Math.max(productRowsCount + 1, 2);

    // Freeze header
    requests.push({
      updateSheetProperties: {
        properties: { sheetId: productsSheetId, gridProperties: { frozenRowCount: 1 } },
        fields: 'gridProperties.frozenRowCount',
      },
    });

    // Header styling (Emerald theme)
    requests.push({
      repeatCell: {
        range: {
          sheetId: productsSheetId,
          startRowIndex: 0,
          endRowIndex: 1,
          startColumnIndex: 0,
          endColumnIndex: 10,
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.059, green: 0.463, blue: 0.431 }, // Emerald #0F766E
            textFormat: {
              foregroundColor: { red: 1.0, green: 1.0, blue: 1.0 },
              bold: true,
              fontSize: 11,
            },
            horizontalAlignment: 'CENTER',
            verticalAlignment: 'MIDDLE',
            wrapStrategy: 'WRAP',
          },
        },
        fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment,wrapStrategy)',
      },
    });

    // Set Header row height
    requests.push({
      updateDimensionProperties: {
        range: { sheetId: productsSheetId, dimension: 'ROWS', startIndex: 0, endIndex: 1 },
        properties: { pixelSize: 40 },
        fields: 'pixelSize',
      },
    });

    // Data rows alternating backgrounds
    for (let r = 1; r < totalRows; r++) {
      const isEven = r % 2 === 0;
      requests.push({
        repeatCell: {
          range: {
            sheetId: productsSheetId,
            startRowIndex: r,
            endRowIndex: r + 1,
            startColumnIndex: 0,
            endColumnIndex: 10,
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: isEven
                ? { red: 1.0, green: 1.0, blue: 1.0 }
                : { red: 0.965, green: 0.984, blue: 0.976 }, // Soft Mint
              verticalAlignment: 'MIDDLE',
            },
          },
          fields: 'userEnteredFormat(backgroundColor,verticalAlignment)',
        },
      });
    }

    // Grid borders
    requests.push({
      updateBorders: {
        range: {
          sheetId: productsSheetId,
          startRowIndex: 0,
          endRowIndex: totalRows,
          startColumnIndex: 0,
          endColumnIndex: 10,
        },
        top: softBorder,
        bottom: softBorder,
        left: softBorder,
        right: softBorder,
        innerHorizontal: softBorder,
        innerVertical: softBorder,
      },
    });

    // Column widths
    requests.push({
      updateDimensionProperties: {
        range: { sheetId: productsSheetId, dimension: 'COLUMNS', startIndex: 1, endIndex: 2 },
        properties: { pixelSize: 220 }, // Product Name
        fields: 'pixelSize',
      },
    });
    requests.push({
      updateDimensionProperties: {
        range: { sheetId: productsSheetId, dimension: 'COLUMNS', startIndex: 2, endIndex: 3 },
        properties: { pixelSize: 130 }, // Category
        fields: 'pixelSize',
      },
    });
  }

  // 2. Format Daily Sales Tab
  const salesSheetId = sheetIdMap[TAB_SALES];
  if (salesSheetId !== undefined) {
    const totalRows = Math.max(salesRowsCount + 1, 2);

    requests.push({
      updateSheetProperties: {
        properties: { sheetId: salesSheetId, gridProperties: { frozenRowCount: 1 } },
        fields: 'gridProperties.frozenRowCount',
      },
    });

    // Header styling (Royal Blue theme)
    requests.push({
      repeatCell: {
        range: {
          sheetId: salesSheetId,
          startRowIndex: 0,
          endRowIndex: 1,
          startColumnIndex: 0,
          endColumnIndex: 10,
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.118, green: 0.227, blue: 0.541 }, // Royal Navy #1E3A8A
            textFormat: {
              foregroundColor: { red: 1.0, green: 1.0, blue: 1.0 },
              bold: true,
              fontSize: 11,
            },
            horizontalAlignment: 'CENTER',
            verticalAlignment: 'MIDDLE',
            wrapStrategy: 'WRAP',
          },
        },
        fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment,wrapStrategy)',
      },
    });

    requests.push({
      updateDimensionProperties: {
        range: { sheetId: salesSheetId, dimension: 'ROWS', startIndex: 0, endIndex: 1 },
        properties: { pixelSize: 40 },
        fields: 'pixelSize',
      },
    });

    for (let r = 1; r < totalRows; r++) {
      const isEven = r % 2 === 0;
      requests.push({
        repeatCell: {
          range: {
            sheetId: salesSheetId,
            startRowIndex: r,
            endRowIndex: r + 1,
            startColumnIndex: 0,
            endColumnIndex: 10,
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: isEven
                ? { red: 1.0, green: 1.0, blue: 1.0 }
                : { red: 0.965, green: 0.976, blue: 0.992 }, // Soft Sky
              verticalAlignment: 'MIDDLE',
            },
          },
          fields: 'userEnteredFormat(backgroundColor,verticalAlignment)',
        },
      });
    }

    requests.push({
      updateBorders: {
        range: {
          sheetId: salesSheetId,
          startRowIndex: 0,
          endRowIndex: totalRows,
          startColumnIndex: 0,
          endColumnIndex: 10,
        },
        top: softBorder,
        bottom: softBorder,
        left: softBorder,
        right: softBorder,
        innerHorizontal: softBorder,
        innerVertical: softBorder,
      },
    });

    requests.push({
      updateDimensionProperties: {
        range: { sheetId: salesSheetId, dimension: 'COLUMNS', startIndex: 1, endIndex: 2 },
        properties: { pixelSize: 220 }, // Product
        fields: 'pixelSize',
      },
    });
  }

  // 3. Format Monthly Summary Tab
  const monthlySheetId = sheetIdMap[TAB_MONTHLY];
  if (monthlySheetId !== undefined) {
    const totalRows = Math.max(monthlyRowsCount + 1, 2);

    requests.push({
      updateSheetProperties: {
        properties: { sheetId: monthlySheetId, gridProperties: { frozenRowCount: 1 } },
        fields: 'gridProperties.frozenRowCount',
      },
    });

    // Header styling (Deep Forest Green theme)
    requests.push({
      repeatCell: {
        range: {
          sheetId: monthlySheetId,
          startRowIndex: 0,
          endRowIndex: 1,
          startColumnIndex: 0,
          endColumnIndex: 8,
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.024, green: 0.373, blue: 0.275 }, // #065F46
            textFormat: {
              foregroundColor: { red: 1.0, green: 1.0, blue: 1.0 },
              bold: true,
              fontSize: 11,
            },
            horizontalAlignment: 'CENTER',
            verticalAlignment: 'MIDDLE',
            wrapStrategy: 'WRAP',
          },
        },
        fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment,wrapStrategy)',
      },
    });

    requests.push({
      updateDimensionProperties: {
        range: { sheetId: monthlySheetId, dimension: 'ROWS', startIndex: 0, endIndex: 1 },
        properties: { pixelSize: 40 },
        fields: 'pixelSize',
      },
    });

    for (let r = 1; r < totalRows; r++) {
      const isEven = r % 2 === 0;
      requests.push({
        repeatCell: {
          range: {
            sheetId: monthlySheetId,
            startRowIndex: r,
            endRowIndex: r + 1,
            startColumnIndex: 0,
            endColumnIndex: 8,
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: isEven
                ? { red: 1.0, green: 1.0, blue: 1.0 }
                : { red: 0.965, green: 0.984, blue: 0.976 },
              verticalAlignment: 'MIDDLE',
            },
          },
          fields: 'userEnteredFormat(backgroundColor,verticalAlignment)',
        },
      });
    }

    requests.push({
      updateBorders: {
        range: {
          sheetId: monthlySheetId,
          startRowIndex: 0,
          endRowIndex: totalRows,
          startColumnIndex: 0,
          endColumnIndex: 8,
        },
        top: softBorder,
        bottom: softBorder,
        left: softBorder,
        right: softBorder,
        innerHorizontal: softBorder,
        innerVertical: softBorder,
      },
    });

    requests.push({
      updateDimensionProperties: {
        range: { sheetId: monthlySheetId, dimension: 'COLUMNS', startIndex: 0, endIndex: 1 },
        properties: { pixelSize: 140 }, // Month
        fields: 'pixelSize',
      },
    });
    requests.push({
      updateDimensionProperties: {
        range: { sheetId: monthlySheetId, dimension: 'COLUMNS', startIndex: 7, endIndex: 8 },
        properties: { pixelSize: 220 }, // Top Product
        fields: 'pixelSize',
      },
    });
  }

  // Execute styling batch
  if (requests.length > 0) {
    try {
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requests }),
      });
    } catch (err) {
      console.warn('Formatting warning:', err);
    }
  }
}

/**
 * Sync all current products, sales, and monthly summary rows to the Google Sheet with high aesthetic formatting.
 */
export async function syncAllDataToGoogleSheet(
  spreadsheetId: string,
  products: Product[],
  sales: SaleRecord[],
  monthlySummaries: MonthlySummary[],
  currencySymbol = '৳'
): Promise<void> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('গুগল একাউন্ট অথেন্টিকেশন পাওয়া যায়নি। অনুগ্রহ করে প্রথমে সাইন-ইন করুন।');
  }

  // 1. Ensure required tabs exist
  const sheetIdMap = await ensureSpreadsheetTabs(spreadsheetId, token);

  // 2. Prepare Products Sheet Data
  const productsHeader = [
    'ক্রমিক (SL)',
    'পণ্যের নাম (Product Name)',
    'ক্যাটাগরি (Category)',
    'একক (Unit)',
    `ক্রয়মূল্য (${currencySymbol})`,
    `বিক্রয়মূল্য (${currencySymbol})`,
    'বর্তমান স্টক (Stock)',
    `স্টক মূল্য (${currencySymbol})`,
    'সর্বমোট বিক্রি (Sold)',
    'স্ট্যাটাস (Status)',
  ];

  const productRows = products.map((p, idx) => {
    const totalSold = sales
      .filter((s) => s.productId === p.id)
      .reduce((sum, s) => sum + s.quantity, 0);
    const stockVal = p.stock * p.costPrice;
    const status =
      p.stock <= 0
        ? 'স্টক শেষ (Out of Stock)'
        : p.stock <= p.minStockAlert
        ? 'কম স্টক (Low)'
        : 'উপলব্ধ (In Stock)';

    return [
      idx + 1,
      p.name,
      p.category || 'সাধারণ',
      p.unit || 'পিস',
      p.costPrice,
      p.sellingPrice,
      p.stock,
      stockVal,
      totalSold,
      status,
    ];
  });

  // 3. Prepare Sales Sheet Data
  const salesHeader = [
    'তারিখ (Date)',
    'পণ্যের নাম (Product)',
    'পরিমাণ (Qty)',
    `ক্রয়মূল্য (${currencySymbol})`,
    `বিক্রয়মূল্য (${currencySymbol})`,
    `মোট বিক্রয় (${currencySymbol})`,
    `মোট ক্রয়খরচ (${currencySymbol})`,
    `মোট লাভ/ক্ষতি (${currencySymbol})`,
    'লাভের হার (%)',
    'নোট (Note)',
  ];

  const salesRows = sales.map((s) => {
    const margin = s.totalRevenue > 0 ? ((s.profit / s.totalRevenue) * 100).toFixed(1) + '%' : '0%';
    return [
      s.date,
      s.productName,
      s.quantity,
      s.unitCostPrice,
      s.sellingPrice,
      s.totalRevenue,
      s.totalCost,
      s.profit,
      margin,
      s.customerNote || '',
    ];
  });

  // 4. Prepare Monthly Summary Sheet Data
  const monthlyHeader = [
    'মাস (Month)',
    'মোট অর্ডার (Sales Count)',
    'মোট বিক্রীত আইটেম (Items Sold)',
    `মোট বিক্রয় (${currencySymbol})`,
    `মোট পণ্য ক্রয়খরচ (${currencySymbol})`,
    `নীট লাভ/ক্ষতি (${currencySymbol})`,
    'সামগ্রিক লাভের হার (%)',
    'শীর্ষ বিক্রিত পণ্য (Top Product)',
  ];

  const monthlyRows = monthlySummaries.map((m) => [
    m.monthName,
    m.totalSalesCount,
    m.totalItemsSold,
    m.totalRevenue,
    m.totalCost,
    m.netProfit,
    `${m.profitMargin.toFixed(1)}%`,
    m.topProduct ? `${m.topProduct.name} (${currencySymbol}${m.topProduct.profit})` : '-',
  ]);

  // Clear existing values in tabs to prevent orphaned rows
  const clearTabs = [TAB_PRODUCTS, TAB_SALES, TAB_MONTHLY];
  for (const tab of clearTabs) {
    try {
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${tab}!A1:Z5000:clear`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
    } catch {
      // Ignore clear errors if sheet is fresh
    }
  }

  // Batch update all values
  const updatePayload = {
    valueInputOption: 'USER_ENTERED',
    data: [
      {
        range: `${TAB_PRODUCTS}!A1`,
        values: [productsHeader, ...productRows],
      },
      {
        range: `${TAB_SALES}!A1`,
        values: [salesHeader, ...salesRows],
      },
      {
        range: `${TAB_MONTHLY}!A1`,
        values: [monthlyHeader, ...monthlyRows],
      },
    ],
  };

  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatePayload),
    }
  );

  if (!updateRes.ok) {
    const err = await updateRes.json().catch(() => ({}));
    throw new Error(err.error?.message || `শিট আপডেট ব্যর্থ হয়েছে (${updateRes.status})`);
  }

  // 5. Apply beautiful theme, headers, borders, zebra striping, and column widths to the Google Sheet!
  await applyBeautifulSheetTheme(
    spreadsheetId,
    token,
    sheetIdMap,
    productRows.length,
    salesRows.length,
    monthlyRows.length
  );
}

/**
 * Fetch a list of spreadsheets accessible to the user from Google Drive.
 */
export async function listUserGoogleSheets(): Promise<Array<{ id: string; name: string }>> {
  const token = await getAccessToken();
  if (!token) return [];

  try {
    const query = encodeURIComponent("mimeType='application/vnd.google-apps.spreadsheet' and trashed=false");
    const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)&pageSize=25`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) return [];
    const data = await res.json();
    return data.files || [];
  } catch (err) {
    console.error('Failed to list sheets:', err);
    return [];
  }
}
