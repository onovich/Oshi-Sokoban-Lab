using System;
using System.IO;
using System.Linq;
using UnityEditor;
using UnityEngine;

public static class ValidateHumanoid
{
    [Serializable] public class Report { public bool valid; public bool human; public int mappedBones; public string[] errors; }
    public static void Run()
    {
        const string path="Assets/SalvageHumanoid-Tpose.fbx";
        AssetDatabase.ImportAsset(path,ImportAssetOptions.ForceSynchronousImport);
        var model=AssetDatabase.LoadAssetAtPath<GameObject>(path);
        var names=model.GetComponentsInChildren<Transform>(true).Select(t=>t.name).ToHashSet();
        var importer=(ModelImporter)AssetImporter.GetAtPath(path);
        var description=importer.humanDescription;
        description.human=HumanTrait.BoneName.Where(n=>names.Contains(n.Replace(" ","")))
            .Select(n=>new HumanBone { humanName=n,boneName=n.Replace(" ",""),limit=new HumanLimit{useDefaultValues=true} }).ToArray();
        description.armStretch=.05f;description.legStretch=.05f;description.upperArmTwist=.5f;description.lowerArmTwist=.5f;description.upperLegTwist=.5f;description.lowerLegTwist=.5f;
        importer.animationType=ModelImporterAnimationType.Human;
        importer.avatarSetup=ModelImporterAvatarSetup.CreateFromThisModel;
        importer.humanDescription=description;
        importer.SaveAndReimport();
        var avatar=AssetDatabase.LoadAllAssetsAtPath(path).OfType<Avatar>().FirstOrDefault();
        var report=new Report{valid=avatar!=null&&avatar.isValid,human=avatar!=null&&avatar.isHuman,mappedBones=description.human.Length,errors=Array.Empty<string>()};
        File.WriteAllText(Path.Combine(Directory.GetCurrentDirectory(),"humanoid-validation.json"),JsonUtility.ToJson(report,true));
        Debug.Log("HUMANOID_VALIDATION "+JsonUtility.ToJson(report));
        if(!report.valid||!report.human)EditorApplication.Exit(2);
    }
}
