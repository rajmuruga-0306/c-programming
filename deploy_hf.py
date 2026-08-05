import os
import sys
from huggingface_hub import HfApi, create_repo

def deploy():
    print("==================================================")
    print("   HostelHub C Backend — Hugging Face Deployer    ")
    print("==================================================")

    token = os.environ.get("HF_TOKEN")
    if not token and len(sys.argv) > 1:
        token = sys.argv[1]

    if not token:
        token = input("Enter your Hugging Face Access Token (from https://huggingface.co/settings/tokens): ").strip()

    if not token:
        print("Error: Hugging Face token is required.")
        return

    repo_name = input("Enter Space name (default: hostelhub-c-backend): ").strip() or "hostelhub-c-backend"

    api = HfApi(token=token)
    user = api.whoami()["name"]
    repo_id = f"{user}/{repo_name}"

    print(f"\n[1/3] Creating Docker Space '{repo_id}' on Hugging Face...")
    try:
        create_repo(
            repo_id=repo_id,
            repo_type="space",
            space_sdk="docker",
            private=False,
            token=token,
            exist_ok=True
        )
        print(f"✅ Space created/verified: https://huggingface.co/spaces/{repo_id}")
    except Exception as e:
        print(f"Note: {e}")

    print("\n[2/3] Uploading C Backend source files & Dockerfile...")
    folder_path = os.path.join(os.path.dirname(__file__), "c_backend_hf")

    api.upload_folder(
        folder_path=folder_path,
        repo_id=repo_id,
        repo_type="space",
        token=token
    )

    print("\n==================================================")
    print("🎉 DEPLOYMENT COMPLETE!")
    print(f"🔗 Hugging Face Space URL: https://huggingface.co/spaces/{repo_id}")
    print(f"⚡ Direct API Endpoint: https://{user}-{repo_name.replace('_', '-')}.hf.space")
    print("==================================================")

if __name__ == "__main__":
    deploy()
