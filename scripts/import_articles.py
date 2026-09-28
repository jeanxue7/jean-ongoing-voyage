"""Import only the supplied public-article folder; preserve source bytes."""
from pathlib import Path
import argparse
import hashlib
import json
import re
import shutil

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('source', type=Path)
args = parser.parse_args()
source = args.source / '公众号文章'
if not source.is_dir():
    raise SystemExit('Missing 公众号文章 directory')
destination = ROOT / 'content/articles'
destination.mkdir(parents=True, exist_ok=True)
records = []
for path in sorted(source.glob('*.md')):
    text = path.read_text(encoding='utf-8')
    title = re.search(r'^# (.+)$', text, re.M)
    date = re.search(r'发布日期：(\d{4}-\d{2}-\d{2})', text)
    url = re.search(r'https://mp\.weixin\.qq\.com/s/[^\s]+', text)
    if not all((title, date, url)):
        raise ValueError(f'Missing metadata: {path.name}')
    number = int(path.name.split('_', 1)[0])
    section = ('people' if number in (8, 9, 12, 14, 15, 17, 19, 20)
               else 'bar' if number in (3, 6)
               else 'places' if number in (7, 10, 11, 16, 22, 23, 24)
               else 'life')
    target = destination / path.name
    if target.exists() and target.read_bytes() != path.read_bytes():
        raise ValueError(f'Local article differs; review before replacing: {target}')
    shutil.copy2(path, target)
    records.append({
        'id': f'article-{number:02d}', 'title': title.group(1),
        'date': date.group(1), 'url': url.group(),
        'bodyFile': str(target.relative_to(ROOT)),
        'sourceFile': str(path),
        'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
        'suggestedSection': section,
        'sectionStatus': 'editorial-proposal',
        'publicationStatus': 'imported-not-published',
        'sourceType': 'user-provided-markdown',
    })
(ROOT / 'content/articles-index.json').write_text(
    json.dumps(records, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
links_path = ROOT / 'content/source-links.json'
links = json.loads(links_path.read_text())
by_url = {item['url']: item for item in records}
matched = 0
for item in links['links']:
    if item['url'] in by_url:
        record = by_url[item['url']]
        item.update(title=record['title'], readStatus='local-markdown-available',
                    articleId=record['id'], bodyFile=record['bodyFile'])
        matched += 1
links_path.write_text(json.dumps(links, ensure_ascii=False, indent=2) + '\n')
print(f'Imported {len(records)} articles; matched {matched}/{len(links["links"])} prior links.')
