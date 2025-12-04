import sys, os, requests
from io import BytesIO
from datetime import datetime
from collections import OrderedDict
from dotenv import load_dotenv
from supabase import create_client, Client
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.colors import HexColor
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# -----------------------
# ENV & CLIENT
# -----------------------
load_dotenv(".env.local")
SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = (
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    or os.getenv("SUPABASE_KEY")
    or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
)
if not SUPABASE_URL or not SUPABASE_KEY:
    raise SystemExit("❌ SUPABASE_URL / KEY are missing in .env.local")

sb: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

API_BASE = os.getenv("API_BASE", "http://localhost:3333")


# Storage base
STORE = f"{SUPABASE_URL}/storage/v1/object/public/astro-forecasts/personiba"

# Fonts
pdfmetrics.registerFont(TTFont("DejaVu", os.path.join(os.path.dirname(__file__), "DejaVuSans.ttf")))

# -----------------------
# HELPERS
# -----------------------
def reduce22(n: int) -> int:
    while n > 22:
        n = sum(int(d) for d in str(n))
    return n

def year_reduced(y: int) -> int:
    return reduce22(sum(int(d) for d in str(y)))

def get(url: str) -> bytes:
    r = requests.get(url)
    if r.status_code != 200:
        raise RuntimeError(f"GET failed: {url} -> {r.status_code}")
    return r.content

def draw_page(c: canvas.Canvas, title: str, img_bytes: bytes, is_star=False):
    W, H = width, height
    green_bg = HexColor("#0b1f1c")
    c.setFillColor(green_bg)
    c.rect(0, 0, W, H, fill=1, stroke=0)

    reader = ImageReader(BytesIO(img_bytes))
    iw, ih = reader.getSize()
    aspect = iw / ih

    # --- если это звезда ---
    if is_star:
        target_w = W * 0.85
        target_h = target_w / aspect
        if target_h > H * 0.85:
            target_h = H * 0.85
            target_w = target_h * aspect
        x = (W - target_w) / 2
        y = (H - target_h) / 2 + 20
        c.drawImage(reader, x, y, width=target_w, height=target_h,
                    preserveAspectRatio=True, mask="auto")

        c.setFont("DejaVu", 38)
        c.setFillColor("white")
        c.drawCentredString(W / 2, H - 80, "Tava numeroloģiskā zvaigzne")

    # --- если это треугольники (у них есть title) ---
    elif title:
        target_w = W * 0.85
        target_h = target_w / aspect
        if target_h > H * 0.75:
            target_h = H * 0.75
            target_w = target_h * aspect
        x = (W - target_w) / 2
        y = (H - target_h) / 2 - 40
        c.drawImage(reader, x, y, width=target_w, height=target_h,
                    preserveAspectRatio=True, mask="auto")

        c.setFont("DejaVu", 46)
        c.setFillColor("white")
        lines = title.split("\n")
        for i, line in enumerate(lines):
            y_pos = H - 120 - (i * 55)
            c.drawCentredString(W / 2, y_pos, line)

    # --- все остальные обычные слайды — во всю страницу ---
    else:
        c.drawImage(reader, 0, 0, width=W, height=H,
                    preserveAspectRatio=False, mask="auto")

    c.showPage()


def uniq_keep_order(nums):
    seen = set()
    out = []
    for n in nums:
        if n not in seen:
            seen.add(n)
            out.append(n)
    return out

def tri_order(nums: dict):
    """Fixed order for slides: top → ml → mr → left → mb → right (without accidental reordering)"""
    seq = [nums["top"], nums["ml"], nums["mr"], nums["left"], nums["mb"], nums["right"]]
    out = []
    for n in seq:
        if n not in out:
            out.append(n)
    return out

# -----------------------
# TRIANGLE MATH (как в TS)
# -----------------------
def personiba_numbers(d: int, m: int, y: int):
    d1 = reduce22(d)
    yR = year_reduced(y)
    # bottomRight
    br = reduce22(d1 + m)
    # bottomLeft — каскад по твоему описанию
    a1 = d1
    a2 = m
    a3 = yR
    a4 = reduce22(a1 + a2 + a3)
    a5 = reduce22(a1 + a2 + a3 + a4)
    bl = reduce22(a1 + a5)
    # Middles
    mr = reduce22(d1 + br)
    ml = reduce22(d1 + bl)
    mb = reduce22(br + bl)
    return OrderedDict(top=d1, right=br, left=bl, mr=mr, ml=ml, mb=mb)

def dzimta_numbers(d: int, m: int, y: int):
    d1 = reduce22(d)
    yR = year_reduced(y)
    top = reduce22(m)
    right = reduce22(m + yR)
    left = reduce22(d1 + m)
    mr = reduce22(top + right)
    ml = reduce22(top + left)
    mb = reduce22(right + left)
    return OrderedDict(top=top, right=right, left=left, mr=mr, ml=ml, mb=mb)

def finanses_numbers(d: int, m: int, y: int):
    """
    Full parity with triangleFinanses.ts
    """
    # === Reduce all base numbers ===
    day_reduced = reduce22(d)
    month_reduced = reduce22(m)
    year_sum = sum(int(ch) for ch in str(y))
    year_reduced = reduce22(year_sum)

    # === Core math ===
    inner_sum = reduce22(day_reduced + month_reduced + year_reduced)

    top = year_reduced
    right = reduce22(year_reduced + inner_sum)
    left = reduce22(year_reduced + month_reduced)
    mr = reduce22(year_reduced + right)
    ml = reduce22(year_reduced + left)
    mb = reduce22(right + left)

    return OrderedDict(top=top, right=right, left=left, mr=mr, ml=ml, mb=mb)



def attiecibas_numbers(d: int, m: int, y: int):
    """
    Full parity with triangleAttiecibas.ts (canvas version)
    """
    # === Reduce helpers ===
    d1 = reduce22(d)
    y_sum = sum(int(ch) for ch in str(y))
    yR = reduce22(y_sum)
    month = m  # месяц НЕ редуцируем

    # (1) Верхняя = день↓ + месяц + год↓
    top = reduce22(d1 + month + yR)

    # внутренняя сумма (combo) = dRaw + mRaw + yearSum + top
    combo = reduce22(d + m + y_sum + top)

    # (2) Нижняя правая = top + combo
    right = reduce22(top + combo)

    # (3) Нижняя левая = top + год↓
    left = reduce22(top + yR)

    # (4) Средняя правая = top + right
    mr = reduce22(top + right)

    # (5) Средняя левая = top + left
    ml = reduce22(top + left)

    # (6) Средняя нижняя = right + left
    mb = reduce22(right + left)

    return OrderedDict(top=top, right=right, left=left, mr=mr, ml=ml, mb=mb)

def veseliba_numbers(d: int, m: int, y: int):
    """
    Full parity with triangleVeseliba.ts
    """
    # === Reduce each component ===
    day_reduced = reduce22(d)
    month_reduced = reduce22(m)
    year_sum = sum(int(ch) for ch in str(y))
    year_reduced = reduce22(year_sum)

    # (1) Внутренняя сумма (день + месяц + год)
    base_sum = reduce22(day_reduced + month_reduced + year_reduced)

    # (2) Верхняя = день + месяц + год + base_sum
    top = reduce22(day_reduced + month_reduced + year_reduced + base_sum)

    # (3) Нижняя правая = top + день
    right = reduce22(top + day_reduced)

    # (4) Нижняя левая = top + base_sum
    left = reduce22(top + base_sum)

    # (5) Средняя правая = top + right
    mr = reduce22(top + right)

    # (6) Средняя левая = top + left
    ml = reduce22(top + left)

    # (7) Средняя нижняя = right + left
    mb = reduce22(right + left)

    return OrderedDict(top=top, right=right, left=left, mr=mr, ml=ml, mb=mb)


# Misija (3 числа)
def misija_numbers(d: int, m: int, y: int):
    one = reduce22(d)
    two = m
    three = year_reduced(y)
    four = reduce22(one + two + three)
    five = reduce22(one + two + three + four)
    six = reduce22(one + two + three + four + five)
    seven = reduce22(one + two)
    eight = reduce22(two + three)
    nine = reduce22(three + four)
    ten = reduce22(four + five)
    eleven = reduce22(five + one)
    first = six
    second = reduce22(seven + eight + nine + ten + eleven)
    third = reduce22(first + second)  # чтобы точно был слайд mcX.jpg
    return first, second, third


# -----------------------
# MAIN
# -----------------------
if len(sys.argv) < 3:
    print("❌ Usage: python make_personiba_pdf.py DD.MM.YYYY recipient@email.com")
    sys.exit(1)

birthdate = sys.argv[1]
recipient_email = sys.argv[2]
d, m, y = map(int, birthdate.split("."))


# === Prepare PDF (1920x1080) ===
CUSTOM_PAGE = (1920, 1080)

# универсальный путь — под деплой (Linux контейнер) и тесты
out_pdf = f"/tmp/PERSONIBAS_ANALIZE_{birthdate.replace('.','')}.pdf"

c = canvas.Canvas(out_pdf, pagesize=CUSTOM_PAGE)
width, height = CUSTOM_PAGE



# 1-3 MAIN
for i in (1, 2, 3):
    img = get(f"{STORE}/main/P-Main-{i}.jpg")
    draw_page(c, "", img)

# 4 STAR
star_png = get(f"{API_BASE}/api/star?date={birthdate}&format=png")
draw_page(c, "Tava numeroloģiskā zvaigzne", star_png, is_star=True)

# ----- PERSONĪBA -----
# 5 personiba intro
img = get(f"{STORE}/personiba/personiba.jpg")
draw_page(c, "", img)

# 6 triangle image with title
tri_personiba = get(f"{API_BASE}/api/triangle/personiba?date={birthdate}&format=png")
draw_page(c, "PERSONĪBA\nTRIJSTŪRIS", tri_personiba)

# 7-12 slides by triangle numbers (unique, in the order: top, left, right, ml, mr, mb)
p_nums = personiba_numbers(d, m, y)
order_nums = tri_order(p_nums)
for n in order_nums:
    img = get(f"{STORE}/personiba/P{n}.jpg")
    draw_page(c, "", img)


# ----- DZIMTA -----
# 13
img = get(f"{STORE}/dzimta/dzimta.jpg")
draw_page(c, "", img)

# 14
tri_dzimta = get(f"{API_BASE}/api/triangle/dzimta?date={birthdate}&format=png")
draw_page(c, "DZIMTA UN GARĪGUMS\nTRIJSTŪRIS", tri_dzimta)

# 15 month page
month_files = ["1-janvaris","2-februaris","3-marts","4-aprilis","5-maijs","6-junijs","7-julijs","8-augusts","9-septembris","10-oktobris","11-novembris","12-decembris"]
img = get(f"{STORE}/menesi/{month_files[m-1]}.jpg")
draw_page(c, "", img)

# 16-21 — dzc
dz_nums = dzimta_numbers(d, m, y)
order_nums = tri_order(dz_nums)
for n in order_nums:
    img = get(f"{STORE}/dzimta/dzc{n}.jpg")
    draw_page(c, "", img)


# ----- FINANSES -----
# 22
img = get(f"{STORE}/finanses/finanses.jpg")
draw_page(c, "", img)

# 23
tri_fin = get(f"{API_BASE}/api/triangle/finanses?date={birthdate}&format=png")
draw_page(c, "FINANSES UN REALIZĀCIJA\nTRIJSTŪRIS", tri_fin)

# 24-29 — frc2..frc22 (нет frc1)
fin_nums = finanses_numbers(d, m, y)
order_nums = tri_order(fin_nums)
for n in order_nums:
    if n == 1:  # frc1 нет
        continue
    img = get(f"{STORE}/finanses/frc{n}.jpg")
    draw_page(c, "", img)

# ----- ATTIECĪBAS -----
# 30
img = get(f"{STORE}/attiecibas/attiecibas.jpg")
draw_page(c, "", img)

# 31
tri_att = get(f"{API_BASE}/api/triangle/attiecibas?date={birthdate}&format=png")
draw_page(c, "ATTIECĪBAS\nTRIJSTŪRIS", tri_att)

# 32-43 — два слайда p/m по каждому числу; нет 1 и 2
# Попытка взять JSON из API (чтобы совпадало с PNG). Если не получится — локальный расчёт.
att_nums_dict = None
try:
    resp = requests.get(f"{API_BASE}/api/triangle/attiecibas?date={birthdate}&format=json", timeout=5)
    # .json() может упасть, поймаем в except
    data = resp.json()
    # ожидаем ключи: top, ml, mr, left, mb, right
    # приводим к int на всякий случай
    att_nums_dict = {
        "top": int(data["top"]),
        "ml": int(data["ml"]),
        "mr": int(data["mr"]),
        "left": int(data["left"]),
        "mb": int(data["mb"]),
        "right": int(data["right"]),
    }
except Exception:
    att_nums_dict = attiecibas_numbers(d, m, y)

order_nums = tri_order(att_nums_dict)
# Диагностика на время теста (можно закомментить):
print("ATT order (top→ml→mr→left→mb→right):", order_nums)

for n in order_nums:
    n = int(n)
    if n in (1, 2):  # этих файлов нет
        continue
    img_p = get(f"{STORE}/attiecibas/ac{n}p.jpg"); draw_page(c, "", img_p)
    img_m = get(f"{STORE}/attiecibas/ac{n}m.jpg"); draw_page(c, "", img_m)


# ----- VESELĪBA -----
# 44
img = get(f"{STORE}/veseliba/veseliba.jpg")
draw_page(c, "", img)

# 45
tri_ves = get(f"{API_BASE}/api/triangle/veseliba?date={birthdate}&format=png")
draw_page(c, "VESELĪBA\nTRIJSTŪRIS", tri_ves)

# 46-51 — vc1..vc22
ves_nums = veseliba_numbers(d, m, y)
order_nums = tri_order(ves_nums)
for n in order_nums:
    img = get(f"{STORE}/veseliba/vc{n}.jpg")
    draw_page(c, "", img)


# ----- MISIJA -----
# 52 — готовое изображение из API (три кружка на фоне)
misija_png = get(f"{API_BASE}/api/triangle/misija?date={birthdate}&format=png")
draw_page(c, "", misija_png)

# 53-55 — три слайда по числам мисijas
m1, m2, m3 = misija_numbers(d, m, y)
for n in (m1, m2, m3):
    n = reduce22(n)  # на всякий случай, чтобы точно был файл mcX.jpg
    if n < 3:  # в папке нет mc1, mc2
        continue
    img = get(f"{STORE}/misija/mc{n}.jpg")
    draw_page(c, "", img)


# === SAVE AND SEND EMAIL ===
c.save()
print(f"✅ PDF saved: {out_pdf}")

# === SENDGRID EMAIL SEND ===
print(f"📧 Sending email via SendGrid to: {recipient_email}")

from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Email, To, Attachment, FileContent, FileName, FileType, Disposition
import base64

SENDGRID_KEY = os.getenv("SENDGRID_API_KEY")
SENDGRID_FROM = os.getenv("SENDGRID_FROM", "info@parnumerologiju.lv")
SENDGRID_FROM_NAME = os.getenv("SENDGRID_FROM_NAME", "Par Numeroloģiju")
SENDGRID_REPLY_TO = os.getenv("SENDGRID_REPLY_TO", "info@parnumerologiju.lv")

if not SENDGRID_KEY:
    raise SystemExit("❌ Missing SENDGRID_API_KEY environment variable")

print("DEBUG: SENDGRID_KEY prefix:", SENDGRID_KEY[:10] if SENDGRID_KEY else "NONE")
sg = SendGridAPIClient(SENDGRID_KEY)

# read pdf file
with open(out_pdf, "rb") as f:
    pdf_data = f.read()
    encoded_pdf = base64.b64encode(pdf_data).decode()

attachment = Attachment(
    FileContent(encoded_pdf),
    FileName(os.path.basename(out_pdf)),
    FileType("application/pdf"),
    Disposition("attachment")
)

message = Mail(
    from_email=Email(SENDGRID_FROM, SENDGRID_FROM_NAME),
    to_emails=To(recipient_email),
    subject="Numeroloģiskā Personības analīze",
    html_content="""
    <p>Labdien,</p>
    <p>Paldies, ka izvēlējies numeroloģisko <b>Personības analīzi</b> – to, kas palīdz tuvāk iepazīt sevi. 
    Skati to zemāk pielikumā.</p>

    <p>Sevis izzināšana ir viens no vērtīgākajiem soļiem personīgajā izaugsmē – 
    tā ļauj pieņemt apzinātākus lēmumus, būt saskaņā ar sevi un veidot dzīvi, 
    kas patiesi atspoguļo to, kas Tu esi.</p>

    <p>Šajā analīzē Tu atradīsi atbildes un virzienus, kas palīdzēs labāk izprast 
    Tavu personību un iekšējo spēku. Lai šī informācija kalpo kā ceļvedis 
    Tavā izaugsmes un harmonijas ceļā.</p>

    <p>No sirds pateicos par uzticību un to, ka ļāvi man būt daļai no 
    Tava sevis izzināšanas ceļa.</p>

    <p>Ar pateicību un sirsnīgiem sveicieniem,<br><b>Evija</b></p>
  </body>
</html>
"""
)

message.reply_to = Email(SENDGRID_REPLY_TO)
message.attachment = attachment

try:
    response = sg.send(message)
    print(f"📧 SendGrid status: {response.status_code}")
    # На время дебага выводим body, чтобы видеть текст ошибки, если что
    try:
        print(f"📧 SendGrid response body: {response.body}")
    except Exception:
        pass
    print("📧 Email sent via SendGrid (no exception)")
except Exception as e:
    # Очень важно: печатаем ошибку в stdout, чтобы её увидел Node
    print("❌ SendGrid error:", repr(e))

