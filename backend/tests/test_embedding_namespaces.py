from backend.app.services import embeddings


def test_manuscript_collections_are_user_and_document_scoped():
    first = embeddings.manuscript_collection("user-a", "doc-1")
    second_user = embeddings.manuscript_collection("user-b", "doc-1")
    second_doc = embeddings.manuscript_collection("user-a", "doc-2")

    assert first != second_user
    assert first != second_doc
    assert "doc-1" in first


def test_tenant_collection_is_versioned_by_embedding_space():
    name = embeddings.tenant_collection("uni")
    assert name.startswith("uni_")
    assert "demo-university" in name
