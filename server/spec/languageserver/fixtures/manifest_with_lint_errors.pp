#
class example_manifest_with_multiple_lint_errors
{

  # --------------------------------------------------------------------
  # Set cipher suites order as secure as possible (Enables Perfect Forward Secrecy)
  # Remediation list per CIS IIS 8 Benchmark v1.4.0 - 08-24-2015 (minus 3DES)
  # Removed DHE per ITSec on 4/6/16
  # TLS_DHE_RSA_WITH_AES_256_GCM_SHA384 and TLS_DHE_RSA_WITH_AES_128_GCM_SHA256
  # --------------------------------------------------------------------
  $cipherSuitesOrder = "TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA384_P256, \
                        TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA256_P256, \
                        TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA_P256, \
                        TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA_P256, \
                        TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384_P384, \
                        TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256_P256"

  registry::value { 'Cipher Suites':
    key   => 'HKLM\\SOFTWARE\\Policies\\Microsoft\\Cryptography\\Configuration\\SSL\\00010002',
    type  => string,
    value => 'Functions',
    data  => $cipherSuitesOrder,
  }

   # --------------------------------------------------------------------
  # Disable IP Source Routing - Microsoft Security Bulletin MS06-032
  # --------------------------------------------------------------------
  registry::value { 'DisableIPSourceRouting0':
    key   => 'HKLM\\System\\CurrentControlSet\\Services\\Tcpip\\Parameters',
    type  => 'dword',
    value => 'DisableIPSourceRouting',
    data  => 2,
  }

  # --------------------------------------------------------------------
  # Disable IPv6 Source Routing - Microsoft Security Bulletin MS06-032
  # --------------------------------------------------------------------
  registry_value { 'HKLM\System\CurrentControlSet\Services\Tcpip6\Parameters\DisableIPSourceRouting':
    ensure => present,
  	type   => dword,
    data   => 2,
    notify => Reboot['after_run'],
  }

  #Reboot Computer
  reboot { 'after_run':
    apply => finished,
  }

}
