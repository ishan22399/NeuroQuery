import os
import zipfile

def zip_project(source_dir, output_zip):
    with zipfile.ZipFile(output_zip, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(source_dir):
            # Exclude node_modules directories
            dirs[:] = [d for d in dirs if d != "node_modules"]

            for file in files:
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, source_dir)
                zipf.write(file_path, arcname)

if __name__ == "__main__":
    SOURCE_DIR = "/app"        # your project folder
    OUTPUT_ZIP = "APP.zip"    # output zip file name

    zip_project(SOURCE_DIR, OUTPUT_ZIP)
    print(f"✅ Project zipped successfully as {OUTPUT_ZIP}")
