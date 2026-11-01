import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { UnpaidFreightItem } from "@/lib/ledger-calculations";
import { formatCurrency } from "@/lib/utils";

export interface ReceiptCardOptions {
  filterTitle: string;
  items: UnpaidFreightItem[];
  totalPending: number;
  generatedBy?: string;
}

function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export async function generateReceiptCardImage(
  options: ReceiptCardOptions
): Promise<{ blob: Blob; dataUrl: string; fileName: string }> {
  const MAX_VISIBLE_ROWS = 14;
  const visibleItems = options.items.slice(0, MAX_VISIBLE_ROWS);
  const hiddenItems = options.items.slice(MAX_VISIBLE_ROWS);
  const extraRowCount = hiddenItems.length > 0 ? 1 : 0;

  const width = 1080;
  const rowHeight = 68;
  const listRows = Math.max(1, visibleItems.length + extraRowCount);
  const height = 690 + listRows * rowHeight + 250;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas 2D não disponível neste navegador.");
  }

  const fontSans =
    "-apple-system, BlinkMacSystemFont, 'Plus Jakarta Sans', 'Segoe UI', sans-serif";

  // 1. Fundo Esmeralda & Gelo (#F4F8F6)
  ctx.fillStyle = "#F4F8F6";
  ctx.fillRect(0, 0, width, height);

  // Container Branco Principal
  const cardX = 48;
  const cardY = 48;
  const cardW = width - 96;
  const cardH = height - 96;

  ctx.save();
  ctx.shadowColor = "rgba(5, 150, 105, 0.10)";
  ctx.shadowBlur = 36;
  ctx.shadowOffsetY = 12;
  drawRoundRect(ctx, cardX, cardY, cardW, cardH, 44);
  ctx.fillStyle = "#FFFFFF";
  ctx.fill();
  ctx.restore();

  drawRoundRect(ctx, cardX, cardY, cardW, cardH, 44);
  ctx.strokeStyle = "#DCE8E2";
  ctx.lineWidth = 2;
  ctx.stroke();

  // 2. Header Verde Esmeralda
  const headerX = cardX + 36;
  const headerY = cardY + 36;
  const headerW = cardW - 72;
  const headerH = 250;

  const grad = ctx.createLinearGradient(
    headerX,
    headerY,
    headerX + headerW,
    headerY + headerH
  );
  grad.addColorStop(0, "#059669");
  grad.addColorStop(0.55, "#0D9488");
  grad.addColorStop(1, "#10B981");

  drawRoundRect(ctx, headerX, headerY, headerW, headerH, 34);
  ctx.fillStyle = grad;
  ctx.fill();

  // Ícone Caminhão no Header
  drawRoundRect(ctx, headerX + 36, headerY + 34, 72, 72, 20);
  ctx.fillStyle = "rgba(255, 255, 255, 0.20)";
  ctx.fill();

  // Desenho simplificado do caminhão branco dentro do bloco
  ctx.fillStyle = "#FFFFFF";
  drawRoundRect(ctx, headerX + 47, headerY + 52, 30, 24, 5);
  ctx.fill();
  drawRoundRect(ctx, headerX + 79, headerY + 59, 18, 17, 4);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(headerX + 58, headerY + 82, 5.5, 0, Math.PI * 2);
  ctx.arc(headerX + 86, headerY + 82, 5.5, 0, Math.PI * 2);
  ctx.fill();

  // Título & Subtítulo
  ctx.fillStyle = "#FFFFFF";
  ctx.font = `800 34px ${fontSans}`;
  ctx.fillText("Controle de Frete", headerX + 128, headerY + 68);

  const nowFormatted = format(new Date(), "dd 'de' MMMM 'de' yyyy • HH:mm", {
    locale: ptBR,
  });
  ctx.fillStyle = "rgba(236, 253, 245, 0.92)";
  ctx.font = `600 21px ${fontSans}`;
  ctx.fillText(
    `${options.filterTitle} • ${nowFormatted}`,
    headerX + 128,
    headerY + 100
  );

  // Linha divisória sutil no Header
  ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(headerX + 36, headerY + 132);
  ctx.lineTo(headerX + headerW - 36, headerY + 132);
  ctx.stroke();

  // Saldo Total em Aberto no Header
  ctx.fillStyle = "rgba(236, 253, 245, 0.90)";
  ctx.font = `700 19px ${fontSans}`;
  ctx.fillText("TOTAL PENDENTE A RECEBER", headerX + 36, headerY + 172);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = `800 54px ${fontSans}`;
  ctx.fillText(
    formatCurrency(options.totalPending / 100),
    headerX + 36,
    headerY + 228
  );

  // Badge quantidade de lançamentos à direita
  const badgeText = `${options.items.length} ${options.items.length === 1 ? "frete em aberto" : "fretes em aberto"}`;
  ctx.font = `700 21px ${fontSans}`;
  const badgeW = ctx.measureText(badgeText).width + 44;
  drawRoundRect(
    ctx,
    headerX + headerW - 36 - badgeW,
    headerY + 178,
    badgeW,
    48,
    24
  );
  ctx.fillStyle = "rgba(255, 255, 255, 0.20)";
  ctx.fill();
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText(
    badgeText,
    headerX + headerW - 36 - badgeW + 22,
    headerY + 209
  );

  // 3. Tabela de Fretes em Aberto
  let cursorY = headerY + headerH + 48;
  ctx.fillStyle = "#0F291E";
  ctx.font = `800 26px ${fontSans}`;
  ctx.fillText("Relação de Fretes Pendentes", headerX, cursorY);

  cursorY += 24;

  // Cabeçalho da Tabela
  drawRoundRect(ctx, headerX, cursorY, headerW, 54, 16);
  ctx.fillStyle = "#F4F8F6";
  ctx.fill();

  ctx.fillStyle = "#526D60";
  ctx.font = `700 19px ${fontSans}`;
  ctx.fillText("DATA", headerX + 24, cursorY + 34);
  ctx.fillText("TRANSPORTADORA", headerX + 205, cursorY + 34);
  ctx.textAlign = "right";
  ctx.fillText("VALOR", headerX + headerW - 24, cursorY + 34);
  ctx.textAlign = "left";

  cursorY += 66;

  if (visibleItems.length === 0) {
    drawRoundRect(ctx, headerX, cursorY, headerW, 64, 16);
    ctx.fillStyle = "#ECFDF5";
    ctx.fill();
    ctx.fillStyle = "#047857";
    ctx.font = `700 22px ${fontSans}`;
    ctx.fillText(
      "Tudo quitado! Nenhum frete pendente neste filtro.",
      headerX + 24,
      cursorY + 40
    );
    cursorY += 76;
  } else {
    visibleItems.forEach((item, index) => {
      if (index % 2 === 1) {
        drawRoundRect(ctx, headerX, cursorY - 6, headerW, rowHeight - 6, 14);
        ctx.fillStyle = "#F9FCFA";
        ctx.fill();
      }

      const dateStr = format(new Date(item.createdAt), "dd/MM/yyyy");
      ctx.fillStyle = "#526D60";
      ctx.font = `600 22px ${fontSans}`;
      ctx.fillText(dateStr, headerX + 24, cursorY + 34);

      ctx.fillStyle = "#0F291E";
      ctx.font = `700 23px ${fontSans}`;
      const partialNote =
        item.remainingAmount < item.originalAmount ? " (parcial)" : "";
      ctx.fillText(
        `${item.transportName}${partialNote}`,
        headerX + 205,
        cursorY + 34
      );

      ctx.textAlign = "right";
      ctx.fillStyle = "#047857";
      ctx.font = `800 24px ${fontSans}`;
      ctx.fillText(
        formatCurrency(item.remainingAmount / 100),
        headerX + headerW - 24,
        cursorY + 34
      );
      ctx.textAlign = "left";

      // Linha sutil
      ctx.strokeStyle = "#EEF5F1";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(headerX + 16, cursorY + rowHeight - 10);
      ctx.lineTo(headerX + headerW - 16, cursorY + rowHeight - 10);
      ctx.stroke();

      cursorY += rowHeight;
    });

    if (hiddenItems.length > 0) {
      const hiddenSum = hiddenItems.reduce(
        (acc, i) => acc + i.remainingAmount,
        0
      );
      drawRoundRect(ctx, headerX, cursorY - 4, headerW, rowHeight - 8, 14);
      ctx.fillStyle = "#ECFDF5";
      ctx.fill();

      ctx.fillStyle = "#047857";
      ctx.font = `700 21px ${fontSans}`;
      ctx.fillText(
        `+ ${hiddenItems.length} outros fretes anteriores`,
        headerX + 24,
        cursorY + 34
      );

      ctx.textAlign = "right";
      ctx.font = `800 23px ${fontSans}`;
      ctx.fillText(
        formatCurrency(hiddenSum / 100),
        headerX + headerW - 24,
        cursorY + 34
      );
      ctx.textAlign = "left";

      cursorY += rowHeight;
    }
  }

  // 4. Seção Chaves PIX (Caixa + Nubank)
  cursorY += 28;
  ctx.fillStyle = "#0F291E";
  ctx.font = `800 25px ${fontSans}`;
  ctx.fillText("Chaves PIX para Pagamento", headerX, cursorY);

  cursorY += 22;
  const pixCardW = (headerW - 24) / 2;
  const pixCardH = 148;

  // Card PIX Caixa
  drawRoundRect(ctx, headerX, cursorY, pixCardW, pixCardH, 24);
  ctx.fillStyle = "#F4F9FD";
  ctx.fill();
  ctx.strokeStyle = "#CBE2F6";
  ctx.lineWidth = 2;
  ctx.stroke();

  drawRoundRect(ctx, headerX + 22, cursorY + 26, 62, 62, 16);
  ctx.fillStyle = "#005CA9";
  ctx.fill();
  // X estilizado Caixa
  ctx.strokeStyle = "#F37021";
  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(headerX + 68, cursorY + 41);
  ctx.lineTo(headerX + 38, cursorY + 73);
  ctx.stroke();
  ctx.strokeStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.moveTo(headerX + 38, cursorY + 41);
  ctx.lineTo(headerX + 49, cursorY + 53);
  ctx.moveTo(headerX + 57, cursorY + 61);
  ctx.lineTo(headerX + 68, cursorY + 73);
  ctx.stroke();

  ctx.fillStyle = "#005CA9";
  ctx.font = `800 22px ${fontSans}`;
  ctx.fillText("Caixa Econômica", headerX + 102, cursorY + 52);
  ctx.fillStyle = "#526D60";
  ctx.font = `700 17px ${fontSans}`;
  ctx.fillText("CHAVE TELEFONE", headerX + 102, cursorY + 78);
  ctx.fillStyle = "#0F291E";
  ctx.font = `800 26px ${fontSans}`;
  ctx.fillText("67 98419-9182", headerX + 102, cursorY + 116);

  // Card PIX Nubank
  const nuX = headerX + pixCardW + 24;
  drawRoundRect(ctx, nuX, cursorY, pixCardW, pixCardH, 24);
  ctx.fillStyle = "#FAF5FF";
  ctx.fill();
  ctx.strokeStyle = "#DFC7F7";
  ctx.lineWidth = 2;
  ctx.stroke();

  drawRoundRect(ctx, nuX + 22, cursorY + 26, 62, 62, 16);
  ctx.fillStyle = "#820AD1";
  ctx.fill();
  ctx.fillStyle = "#FFFFFF";
  ctx.font = `800 28px ${fontSans}`;
  ctx.fillText("nu", nuX + 35, cursorY + 66);

  ctx.fillStyle = "#820AD1";
  ctx.font = `800 22px ${fontSans}`;
  ctx.fillText("Nubank", nuX + 102, cursorY + 52);
  ctx.fillStyle = "#526D60";
  ctx.font = `700 17px ${fontSans}`;
  ctx.fillText("CHAVE CPF", nuX + 102, cursorY + 78);
  ctx.fillStyle = "#0F291E";
  ctx.font = `800 26px ${fontSans}`;
  ctx.fillText("000.820.251-69", nuX + 102, cursorY + 116);

  // Rodapé sutil
  const footerY = cardY + cardH - 28;
  ctx.fillStyle = "#7A9688";
  ctx.font = `600 18px ${fontSans}`;
  ctx.fillText(
    options.generatedBy
      ? `Emitido por ${options.generatedBy} via Controle de Frete`
      : "Emitido automaticamente via Controle de Frete",
    headerX,
    footerY
  );

  const dataUrl = canvas.toDataURL("image/png");
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => {
      if (b) resolve(b);
      else reject(new Error("Falha ao exportar PNG."));
    }, "image/png");
  });

  const dateSlug = format(new Date(), "dd-MM-yyyy");
  const fileName = `demonstrativo-fretes-${dateSlug}.png`;

  return { blob, dataUrl, fileName };
}
